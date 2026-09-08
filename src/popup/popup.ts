/*
 * Popup logic: AI action buttons (solution code + complexity analysis),
 * streaming response rendering, and the settings view.
 */

import { OpenRouterProvider } from '../background/openrouter/openrouter.js';
import { ChatGPTRelayProvider } from '../background/chatgpt-relay/chatgpt-relay.js';

type Action = 'analyze' | 'fix';

interface AIProvider {
    generateAnswer(params: {
        prompt: string;
        action: Action;
        onEvent: (arg: { type: string; data?: { text: string } }) => void;
    }): Promise<void>;
}

/*
 * Tries the ChatGPT relay first (free, needs a logged-in chatgpt.com session);
 * falls back to OpenRouter only if the relay fails before emitting any answer
 * chunks. Once tokens have streamed to the UI, a mid-stream failure surfaces
 * as an error rather than restarting with a different model.
 *
 * The relay is skipped entirely when the user turned it off in settings or
 * when a recent attempt found no ChatGPT login, so we don't keep opening
 * chatgpt.com tabs that immediately fail.
 */
class FallbackProvider implements AIProvider {
    constructor(private primary: AIProvider, private fallback: AIProvider) { }

    async generateAnswer(params: {
        prompt: string;
        action: Action;
        onEvent: (arg: { type: string; data?: { text: string } }) => void;
    }): Promise<void> {
        if (!(await this.primaryAvailable())) {
            params.onEvent({ type: 'provider', data: { text: 'fallback' } });
            await this.fallback.generateAnswer(params);
            return;
        }
        params.onEvent({ type: 'provider', data: { text: 'chatgpt' } });

        let primaryEmittedAnswer = false;
        try {
            await this.primary.generateAnswer({
                ...params,
                onEvent: (evt) => {
                    if (evt.type === 'answer') primaryEmittedAnswer = true;
                    // Errors before any output are handled by falling back, so
                    // don't flash them in the UI.
                    if (evt.type === 'error' && !primaryEmittedAnswer) return;
                    params.onEvent(evt);
                },
            });
        } catch (primaryErr) {
            if (primaryEmittedAnswer) throw primaryErr;
            console.warn('ChatGPT relay failed, falling back:', primaryErr);
            params.onEvent({ type: 'provider', data: { text: 'fallback' } });
            await this.fallback.generateAnswer(params);
        }
    }

    private async primaryAvailable(): Promise<boolean> {
        const { useChatGPT, chatgptUnavailableUntil } = await chrome.storage.local.get(['useChatGPT', 'chatgptUnavailableUntil']);
        if (useChatGPT === false) return false;
        return !(chatgptUnavailableUntil && Date.now() < chatgptUnavailableUntil);
    }
}

const homeView = document.getElementById('home-view') as HTMLElement;
const settingsView = document.getElementById('settings-view') as HTMLElement;
const problemTitleEl = document.getElementById('problem-title') as HTMLElement;
const contextDot = document.getElementById('context-dot') as HTMLElement;
const statusLine = document.getElementById('status') as HTMLElement;
const analyzeResponse = document.getElementById('analyze-code-response') as HTMLElement;
const fixCodeContainer = document.getElementById('fix-code-container') as HTMLElement;
const fixCodeResponse = document.getElementById('fix-code-response') as HTMLElement;
const fixCodeButton = document.getElementById('fix-code-btn') as HTMLButtonElement;
const complexityButton = document.getElementById('get-complexity-btn') as HTMLButtonElement;

let problemTitle = '';

function setButtonsDisabled(disabled: boolean) {
    fixCodeButton.disabled = disabled;
    complexityButton.disabled = disabled;
}

const PROVIDER_LABELS: Record<string, [string, string]> = {
    chatgpt: ['via your ChatGPT account', 'Answered by chatgpt.com using your logged-in session.'],
    fallback: ['via free hosted model', 'ChatGPT was unavailable (off in settings, or not logged in), so a free hosted model answered instead.'],
};

let statusTimer: number | null = null;

function setStatus(message: string, state: 'busy' | 'done' | 'error', tooltip = '', clearAfterMs = 0) {
    if (statusTimer !== null) clearTimeout(statusTimer);
    statusLine.textContent = message;
    statusLine.title = tooltip;
    statusLine.className = `status ${state}`;
    if (clearAfterMs) {
        statusTimer = window.setTimeout(() => statusLine.classList.add('hidden'), clearAfterMs);
    }
}

function clearStatus() {
    if (statusTimer !== null) clearTimeout(statusTimer);
    statusLine.classList.add('hidden');
}

function clearResponses() {
    analyzeResponse.textContent = '';
    fixCodeResponse.textContent = '';
    analyzeResponse.classList.add('hidden');
    fixCodeContainer.classList.add('hidden');
    chrome.storage.local.set({ analyzeCodeResponse: '', fixCodeResponse: '' });
}

function formatAnalysis(text: string): string {
    return text
        .replace(/time/gi, '<span class="complexity">time complexity</span>')
        .replace(/space/gi, '<span class="complexity">space complexity</span>')
        .replace(/O\([^)]+\)/g, '<span class="complexity">$&</span>');
}

function stripMarkdownCodeBlock(text: string): string {
    return text.replace(/```[^\n]*\n/, '').replace(/```\s*$/, '');
}

function getCodeFromActiveTab(): Promise<string[] | null> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                resolve(null);
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { type: 'getProblem' }, (response) => {
                if (chrome.runtime.lastError || !response?.data) {
                    resolve(null);
                } else {
                    resolve(response.data);
                }
            });
        });
    });
}

function buildPrompt(action: Action, problemParts: string[]): string {
    const codeText = problemParts.join('\n');
    if (action === 'analyze') {
        return `
        As an experienced software engineer, please analyze the code complexity of the Leetcode
        problem titled ${problemTitle} and the accompanying code below. The output (return value) of
        the function should not be factored into the time and space complexity of the function.
        Return the time and space complexity of the function in big O notation. Your analysis should be direct and concise
        with no more than two sentences. The problem description and code are provided below\n. ${codeText}`;
    }
    return `
    As a coding professional, I need your expertise with a specific LeetCode problem named ${problemTitle}.
    Please follow the instructions:
    1. If no code is provided: Generate an efficient and accurate solution for the problem.
    2. If code is provided and contains errors: Identify the issues, correct them, and optimize the code if possible.
    3. If the provided code is already correct and optimized: Simply return it as-is.
    IMPORTANT: Your response should only include the function definition and code solution in plain text format (no backticks, code blocks, or additional formatting).
    Do not explain your solution or provide any additional information other than the code.
    Here's the problem description, restraints, examples, and code:\n
    ${codeText}`;
}

function timeout(ms: number): Promise<never> {
    return new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${ms} ms`)), ms)
    );
}

function runAction(provider: AIProvider, action: Action, codeText: string[]) {
    setButtonsDisabled(true);
    clearResponses();

    if (action === 'analyze') {
        setStatus('Analyzing complexity', 'busy');
        analyzeResponse.classList.remove('hidden');
    } else {
        setStatus('Writing solution', 'busy');
        fixCodeContainer.classList.remove('hidden');
    }

    let response = '';
    let answeredBy = 'fallback';
    Promise.race([
        provider.generateAnswer({
            prompt: buildPrompt(action, codeText),
            action,
            onEvent: (event) => {
                if (event.type === 'provider' && event.data) {
                    answeredBy = event.data.text;
                    return;
                }
                if (event.type === 'error' && event.data) {
                    setStatus(event.data.text, 'error');
                    setButtonsDisabled(false);
                    return;
                }
                if (event.type === 'answer' && event.data) {
                    if (action === 'fix') {
                        response += event.data.text;
                        fixCodeResponse.textContent = stripMarkdownCodeBlock(response);
                        (window as any).Prism.highlightAll();
                    } else {
                        response += formatAnalysis(event.data.text);
                        analyzeResponse.innerHTML = response;
                    }
                }
                if (event.type === 'done') {
                    setButtonsDisabled(false);
                    const [label, tooltip] = PROVIDER_LABELS[answeredBy] || PROVIDER_LABELS.fallback;
                    setStatus(`Done, ${label}`, 'done', tooltip);
                    chrome.storage.local.set({ lastAction: action });
                    if (action === 'fix') {
                        chrome.storage.local.set({ fixCodeResponse: fixCodeResponse.textContent });
                        (window as any).Prism.highlightAll();
                    } else {
                        chrome.storage.local.set({ analyzeCodeResponse: analyzeResponse.innerHTML });
                    }
                }
            },
        }),
        timeout(150000),
    ]).catch((error) => {
        setStatus(error.message, 'error');
        setButtonsDisabled(false);
    });
}

function initActionButton(button: HTMLButtonElement, action: Action, provider: AIProvider) {
    button.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            runAction(provider, action, codeText);
        } else {
            setStatus('Cannot read the page. Open a LeetCode problem and refresh it.', 'error');
        }
    };
}

async function loadStoredResponses() {
    const stored = await chrome.storage.local.get(['analyzeCodeResponse', 'fixCodeResponse', 'lastAction']);
    if (stored.lastAction === 'analyze' && stored.analyzeCodeResponse) {
        analyzeResponse.innerHTML = stored.analyzeCodeResponse;
        analyzeResponse.classList.remove('hidden');
    }
    if (stored.lastAction === 'fix' && stored.fixCodeResponse) {
        fixCodeResponse.textContent = stored.fixCodeResponse;
        fixCodeContainer.classList.remove('hidden');
        (window as any).Prism.highlightAll();
    }
}

/* ---------------- Theme ---------------- */

function applyTheme(theme: 'dark' | 'light') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('leetcode-explained-theme', theme);
    chrome.storage.local.set({ isDarkTheme: theme === 'dark' });
}

async function initTheme() {
    const { themeMode, isDarkTheme } = await chrome.storage.local.get(['themeMode', 'isDarkTheme']);
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    themeSelect.value = themeMode === 'auto' ? 'auto' : (isDarkTheme ? 'dark' : 'light');
    applyTheme(isDarkTheme === false ? 'light' : 'dark');
    if (themeMode === 'auto') detectThemeFromActiveTab();

    themeSelect.onchange = () => {
        const value = themeSelect.value;
        if (value === 'auto') {
            chrome.storage.local.set({ themeMode: 'auto' });
            detectThemeFromActiveTab();
        } else {
            chrome.storage.local.set({ themeMode: 'manual' });
            applyTheme(value as 'dark' | 'light');
        }
    };
}

function detectThemeFromActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getTheme' }, (response) => {
            if (!chrome.runtime.lastError && response?.theme) {
                applyTheme(response.theme);
            }
        });
    });
}

/* ---------------- Display size ---------------- */

function applyFontSize(fontSize: string) {
    document.body.classList.remove('medium-display', 'large-display');
    if (fontSize === '14') document.body.classList.add('medium-display');
    if (fontSize === '16') document.body.classList.add('large-display');
}

async function initFontSize() {
    const select = document.getElementById('font-size-select') as HTMLSelectElement;
    const { fontSize } = await chrome.storage.local.get('fontSize');
    const value = (fontSize ?? 12).toString();
    select.value = value;
    applyFontSize(value);
    select.onchange = () => {
        chrome.storage.local.set({ fontSize: parseInt(select.value) });
        applyFontSize(select.value);
    };
}

/* ---------------- Settings toggles ---------------- */

const SETTING_TOGGLES: Array<[string, string]> = [
    ['show-company-tags-toggle', 'showCompanyTags'],
    ['show-examples-toggle', 'showExamples'],
    ['show-difficulty-toggle', 'showDifficulty'],
    ['use-chatgpt-toggle', 'useChatGPT'],
];

async function initSettingToggles() {
    for (const [elementId, storageKey] of SETTING_TOGGLES) {
        const toggle = document.getElementById(elementId) as HTMLInputElement;
        const stored = await chrome.storage.local.get(storageKey);
        toggle.checked = stored[storageKey] !== false;
        toggle.onchange = () => {
            chrome.storage.local.set({ [storageKey]: toggle.checked }, () => {
                chrome.runtime.sendMessage({ action: 'settingsUpdate' });
            });
        };
    }
}

/* ---------------- Init ---------------- */

async function main() {
    const settingsToggle = document.getElementById('settings-toggle') as HTMLButtonElement;
    settingsToggle.onclick = () => {
        const showSettings = settingsView.classList.contains('hidden');
        settingsView.classList.toggle('hidden', !showSettings);
        homeView.classList.toggle('hidden', showSettings);
    };

    await Promise.all([initTheme(), initFontSize(), initSettingToggles(), loadStoredResponses()]);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.url?.includes('leetcode.com/problems') && tab.title) {
            problemTitle = tab.title.split('-')[0].trim();
            problemTitleEl.textContent = problemTitle;
            problemTitleEl.classList.remove('empty');
            contextDot.classList.add('live');
            chrome.storage.local.set({ currentLeetCodeProblemTitle: tab.title });
        } else {
            problemTitleEl.classList.add('empty');
        }
    });

    const provider = new FallbackProvider(new ChatGPTRelayProvider(), new OpenRouterProvider());
    initActionButton(fixCodeButton, 'fix', provider);
    initActionButton(complexityButton, 'analyze', provider);

    const copyButton = document.getElementById('copy-code-btn') as HTMLButtonElement;
    copyButton.onclick = async () => {
        if (fixCodeResponse.textContent) {
            await navigator.clipboard.writeText(fixCodeResponse.textContent);
            setStatus('Copied to clipboard', 'done', '', 1500);
        }
    };

    const clearButton = document.getElementById('clear-code-btn') as HTMLButtonElement;
    clearButton.onclick = () => {
        clearResponses();
        clearStatus();
    };
}

main();
