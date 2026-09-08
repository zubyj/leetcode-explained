/*
 * Runs on chatgpt.com. Receives CHATGPT_DRIVE messages from the background,
 * drives the ChatGPT UI (textarea + send button) and streams the assistant
 * response back chunk-by-chunk via CHATGPT_CHUNK / CHATGPT_DONE / CHATGPT_ERROR.
 *
 * We only act on tabs that the extension created and tracks (see chatgpt-relay
 * in background). On any other chatgpt.com tab this script is inert because
 * nobody sends it messages.
 */

const TAB_MARKER_TITLE = 'Leetcode Explained — AI (do not close)';

// Selector candidates, tried in order. ChatGPT redesigns these regularly so
// each lookup uses a fallback chain. If all candidates fail, the request errors
// out — better to surface that than to silently miss.
const PROMPT_INPUT_SELECTORS = [
    '#prompt-textarea',
    '[contenteditable="true"][data-id="root"]',
    'div[contenteditable="true"].ProseMirror',
    'textarea[data-id="root"]',
];

const SEND_BUTTON_SELECTORS = [
    'button[data-testid="send-button"]',
    'button[data-testid="composer-send-button"]',
    'button[aria-label*="Send"]',
];

const STOP_BUTTON_SELECTORS = [
    'button[data-testid="stop-button"]',
    'button[data-testid="composer-stop-button"]',
    'button[aria-label*="Stop"]',
];

const ASSISTANT_MESSAGE_SELECTOR = '[data-message-author-role="assistant"]';

// Substrings (case-insensitive) that indicate ChatGPT itself returned an error
// rather than a normal response. We check both inline error nodes and toasts.
const ERROR_TEXT_PATTERNS: Array<{ pattern: RegExp; userMessage: string }> = [
    {
        pattern: /unusual activity has been detected/i,
        userMessage: 'ChatGPT flagged this request as unusual activity. Try again in a few minutes.',
    },
    {
        pattern: /too many requests|rate limit/i,
        userMessage: 'ChatGPT rate-limited this account. Try again later.',
    },
    {
        pattern: /you've reached our limit of messages/i,
        userMessage: "You've hit ChatGPT's free-tier message limit. Try again later or upgrade.",
    },
    {
        pattern: /please log in|session.*(expired|invalid)/i,
        userMessage: 'ChatGPT session expired. Open chatgpt.com and log in again.',
    },
];

function markTab() {
    // Only mark if this is one of our tabs (background pings us first to claim).
    // Until then, leave the title alone so we don't muck with normal user tabs.
    chrome.runtime.sendMessage({ type: 'CHATGPT_DRIVER_READY' }, (resp) => {
        if (chrome.runtime.lastError) return;
        if (resp?.claimed) {
            document.title = TAB_MARKER_TITLE;
        }
    });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'CHATGPT_DRIVE') {
        handleDriveRequest(msg.prompt, msg.requestId).catch((err: Error) => {
            chrome.runtime.sendMessage({
                type: 'CHATGPT_ERROR',
                requestId: msg.requestId,
                error: err.message,
            });
        });
        sendResponse({ ok: true });
        return true;
    }
    if (msg.type === 'CHATGPT_CLAIM') {
        document.title = TAB_MARKER_TITLE;
        sendResponse({ ok: true });
        return true;
    }
});

async function handleDriveRequest(prompt: string, requestId: string) {
    await waitForLoggedIn();
    await sendPrompt(prompt);
    const conversationId = await streamResponse(requestId);
    chrome.runtime.sendMessage({
        type: 'CHATGPT_DONE',
        requestId,
        conversationId,
    });
    // Fire-and-forget cleanup. Don't await — the popup already has the
    // response and a slow delete shouldn't delay the next interaction.
    if (conversationId) {
        deleteConversation(conversationId).catch((err) => {
            console.warn('Auto-delete failed:', err);
        });
    }
}

async function deleteConversation(id: string): Promise<void> {
    // ChatGPT's "delete" is actually a soft delete: PATCH the conversation
    // with is_visible=false, which removes it from the sidebar.
    const session = await fetch('/api/auth/session').then((r) => r.json());
    const token = session?.accessToken;
    if (!token) return;

    await fetch(`/backend-api/conversation/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_visible: false }),
        credentials: 'include',
    });
}

async function waitForLoggedIn() {
    // If we land on /auth/login or see a "Log in" button, the user isn't authed.
    // Fail fast with a clear message so the background can surface it.
    const loginIndicator = document.querySelector(
        'button[data-testid="login-button"], a[href*="/auth/login"]'
    );
    if (loginIndicator || location.pathname.includes('/auth/')) {
        throw new Error('Not logged into ChatGPT. Please log in and try again.');
    }
}

async function sendPrompt(prompt: string) {
    const input = await waitForSelector<HTMLElement>(PROMPT_INPUT_SELECTORS, 15000);
    input.focus();

    if (input instanceof HTMLTextAreaElement) {
        // Use the native value setter so React's onChange fires (React caches the
        // last value and skips events if you assign .value directly).
        const setter = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            'value'
        )?.set;
        setter?.call(input, prompt);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        // ProseMirror / contenteditable. execCommand is deprecated but is still
        // the most reliable way to insert text that fires the editor's input
        // pipeline correctly.
        document.execCommand('selectAll', false);
        document.execCommand('insertText', false, prompt);
    }

    // Send button enables async after React processes the input event.
    await sleep(150);
    const sendButton = await waitForEnabledButton(SEND_BUTTON_SELECTORS, 5000);
    sendButton.click();
}

async function streamResponse(requestId: string): Promise<string | undefined> {
    // Wait for at least one assistant message to appear in the DOM.
    await waitForSelector<HTMLElement>([ASSISTANT_MESSAGE_SELECTOR], 30000);

    return new Promise<string | undefined>((resolve, reject) => {
        let lastText = '';
        let stableTicks = 0;
        const STABLE_TICKS_BEFORE_DONE = 4; // ~800ms of no change after stop-button gone

        const interval = setInterval(() => {
            // Check for an error indicator before reading the latest message:
            // some failures replace the assistant message entirely with an
            // error toast, so missing that check would hang until timeout.
            const errorMatch = findKnownErrorMessage();
            if (errorMatch) {
                clearInterval(interval);
                clearTimeout(timeoutId);
                reject(new Error(errorMatch));
                return;
            }

            const messages = document.querySelectorAll<HTMLElement>(
                ASSISTANT_MESSAGE_SELECTOR
            );
            const latest = messages[messages.length - 1];
            if (!latest) return;

            const text = latest.innerText || '';

            if (text.length > lastText.length) {
                const newChunk = text.slice(lastText.length);
                chrome.runtime.sendMessage({
                    type: 'CHATGPT_CHUNK',
                    requestId,
                    text: newChunk,
                });
                lastText = text;
                stableTicks = 0;
                return;
            }

            const stopButton = querySelectorAny<HTMLButtonElement>(STOP_BUTTON_SELECTORS);
            if (!stopButton) {
                stableTicks++;
                if (stableTicks >= STABLE_TICKS_BEFORE_DONE) {
                    clearInterval(interval);
                    clearTimeout(timeoutId);
                    resolve(extractConversationId());
                }
            }
        }, 200);

        const timeoutId = setTimeout(() => {
            clearInterval(interval);
            reject(new Error('ChatGPT response timed out after 120s.'));
        }, 120000);
    });
}

function findKnownErrorMessage(): string | null {
    // Inspect a small set of candidate containers rather than scanning all of
    // document.body — keeps the per-tick cost bounded on a heavy React page.
    const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
            '[role="alert"], [data-testid*="error"], [class*="Toast"], [class*="toast"], main'
        )
    );
    for (const el of candidates) {
        const text = el.innerText || '';
        if (text.length > 2000) continue; // skip the main message stream itself
        for (const { pattern, userMessage } of ERROR_TEXT_PATTERNS) {
            if (pattern.test(text)) return userMessage;
        }
    }
    return null;
}

function extractConversationId(): string | undefined {
    // After send, ChatGPT navigates the URL to /c/<conversation-id>
    const match = location.pathname.match(/^\/c\/([0-9a-f-]+)/);
    return match?.[1];
}

function waitForSelector<T extends Element>(
    selectors: string[],
    timeoutMs: number
): Promise<T> {
    return new Promise((resolve, reject) => {
        const found = querySelectorAny<T>(selectors);
        if (found) {
            resolve(found);
            return;
        }

        const observer = new MutationObserver(() => {
            const el = querySelectorAny<T>(selectors);
            if (el) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error(
                    `Timeout waiting for ChatGPT UI element (${selectors.join(', ')}). LeetCode Explained may need an update for the latest ChatGPT layout.`
                )
            );
        }, timeoutMs);
    });
}

async function waitForEnabledButton(
    selectors: string[],
    timeoutMs: number
): Promise<HTMLButtonElement> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const btn = querySelectorAny<HTMLButtonElement>(selectors);
        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
            return btn;
        }
        await sleep(100);
    }
    throw new Error('Send button never enabled — prompt may not have been registered.');
}

function querySelectorAny<T extends Element>(selectors: string[]): T | null {
    for (const sel of selectors) {
        const el = document.querySelector<T>(sel);
        if (el) return el;
    }
    return null;
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

markTab();
