/*
 * Background coordinator for the ChatGPT-tab driving approach (Flavor 1).
 *
 * Two responsibilities:
 *   1. Tab management: maintain a single chatgpt.com tab that we own,
 *      identified by tabId in chrome.storage.local. We never touch tabs we
 *      didn't create.
 *   2. Message routing: popup opens a port → we forward the prompt to our
 *      driver content script → driver sends chunks back via runtime messages
 *      → we route them to the right port by requestId.
 */

const STORAGE_KEY_TAB_ID = 'chatgptTabId';
const CHATGPT_HOME_URL = 'https://chatgpt.com/';
const TAB_LOAD_TIMEOUT_MS = 30000;

// requestId → port. Used to route driver responses to the right popup/page.
const activeRequests = new Map<string, chrome.runtime.Port>();

// Tab IDs we created and therefore "own." Used to decide whether to claim a
// driver instance (set the tab title marker) when a driver pings us.
const ownedTabIds = new Set<number>();

export function initChatGPTRelay() {
    chrome.runtime.onConnect.addListener((port) => {
        if (port.name !== 'chatgpt-request') return;

        port.onMessage.addListener(async (msg: { prompt: string; requestId: string }) => {
            const requestId = msg.requestId || crypto.randomUUID();
            activeRequests.set(requestId, port);

            try {
                const tabId = await getOrCreateChatGPTTab();
                chrome.tabs.sendMessage(tabId, {
                    type: 'CHATGPT_DRIVE',
                    prompt: msg.prompt,
                    requestId,
                });
            } catch (err) {
                port.postMessage({ type: 'error', error: (err as Error).message });
                activeRequests.delete(requestId);
            }
        });

        port.onDisconnect.addListener(() => {
            for (const [id, p] of activeRequests) {
                if (p === port) activeRequests.delete(id);
            }
        });
    });

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === 'CHATGPT_DRIVER_READY') {
            // Driver pinged on load. Claim it only if it's running in one of
            // our owned tabs — that's the signal to mark the tab title.
            const tabId = sender.tab?.id;
            const claimed = tabId !== undefined && ownedTabIds.has(tabId);
            sendResponse({ claimed });
            return false;
        }

        if (msg.type === 'CHATGPT_CHUNK' || msg.type === 'CHATGPT_DONE' || msg.type === 'CHATGPT_ERROR') {
            const port = activeRequests.get(msg.requestId);
            if (!port) return false;

            try {
                if (msg.type === 'CHATGPT_CHUNK') {
                    port.postMessage({ type: 'chunk', text: msg.text });
                } else if (msg.type === 'CHATGPT_DONE') {
                    port.postMessage({ type: 'done' });
                    activeRequests.delete(msg.requestId);
                } else {
                    port.postMessage({ type: 'error', error: msg.error });
                    activeRequests.delete(msg.requestId);
                }
            } catch {
                activeRequests.delete(msg.requestId);
            }
            return false;
        }
    });

    // Stop tracking a tab once it's actually closed so we don't get fooled by
    // tabId reuse later.
    chrome.tabs.onRemoved.addListener((tabId) => {
        ownedTabIds.delete(tabId);
        chrome.storage.local.get(STORAGE_KEY_TAB_ID, (result) => {
            if (result[STORAGE_KEY_TAB_ID] === tabId) {
                chrome.storage.local.remove(STORAGE_KEY_TAB_ID);
            }
        });
    });
}

async function getOrCreateChatGPTTab(): Promise<number> {
    const stored = await chrome.storage.local.get(STORAGE_KEY_TAB_ID);
    const cachedId: number | undefined = stored[STORAGE_KEY_TAB_ID];

    if (cachedId !== undefined) {
        try {
            const tab = await chrome.tabs.get(cachedId);
            if (tab.url && tab.url.startsWith('https://chatgpt.com')) {
                ownedTabIds.add(cachedId);
                // Reset to fresh conversation before each request so we don't
                // get state from a previous prompt bleeding in.
                if (tab.url !== CHATGPT_HOME_URL) {
                    await chrome.tabs.update(cachedId, { url: CHATGPT_HOME_URL });
                    await waitForTabComplete(cachedId);
                }
                // Re-mark in case page navigated. Driver will set title.
                chrome.tabs.sendMessage(cachedId, { type: 'CHATGPT_CLAIM' }, () => {
                    void chrome.runtime.lastError; // swallow if driver not yet ready
                });
                return cachedId;
            }
        } catch {
            // Tab gone, fall through to create.
        }
    }

    const newTab = await chrome.tabs.create({
        url: CHATGPT_HOME_URL,
        active: false,
    });
    if (newTab.id === undefined) {
        throw new Error('Failed to create ChatGPT tab.');
    }
    ownedTabIds.add(newTab.id);
    await chrome.storage.local.set({ [STORAGE_KEY_TAB_ID]: newTab.id });
    await waitForTabComplete(newTab.id);
    return newTab.id;
}

function waitForTabComplete(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
            if (id === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                clearTimeout(timeoutId);
                // Driver content script needs a moment after document_end to
                // wire up its message listener. Give it a small grace period.
                setTimeout(resolve, 300);
            }
        };
        const timeoutId = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error('ChatGPT tab load timed out.'));
        }, TAB_LOAD_TIMEOUT_MS);
        chrome.tabs.onUpdated.addListener(listener);
    });
}

/*
 * Mirrors the OpenRouterProvider interface so popup.ts can swap in this
 * class without other changes.
 */
export class ChatGPTRelayProvider {
    generateAnswer(params: {
        prompt: string;
        action: string;
        onEvent: (arg: { type: string; data?: { text: string } }) => void;
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: 'chatgpt-request' });
            const requestId = crypto.randomUUID();

            port.onMessage.addListener((msg: { type: string; text?: string; error?: string }) => {
                if (msg.type === 'chunk' && msg.text !== undefined) {
                    params.onEvent({ type: 'answer', data: { text: msg.text } });
                } else if (msg.type === 'done') {
                    params.onEvent({ type: 'done' });
                    port.disconnect();
                    resolve();
                } else if (msg.type === 'error') {
                    const errText = msg.error || 'Unknown error';
                    params.onEvent({ type: 'error', data: { text: errText } });
                    port.disconnect();
                    reject(new Error(errText));
                }
            });

            port.onDisconnect.addListener(() => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message || 'Port disconnected'));
                }
            });

            port.postMessage({ prompt: params.prompt, requestId });
        });
    }
}
