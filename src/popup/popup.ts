/*
Contains the logic behind the popup window that appears when the extension icon is clicked.
Creates the GPT buttons, sets the prompts, and displays the responses.
The user can also copy the code to their clipboard, clear the code, and open the settings page.
*/

import { initializeTheme } from '../utils/theme.js';
import { OpenRouterProvider } from '../background/openrouter/openrouter.js';
import { ChatGPTProvider } from '../background/chatgpt/chatgpt.js';

// Add interface for ChatGPTProvider at the top level
interface AIProvider {
    generateAnswer(params: {
        prompt: string,
        onEvent: (arg: { type: string, data?: { text: string } }) => void
    }): Promise<void>;
}

/* Element selectors */
const selectors: { [key: string]: string } = {
    fixCodeBtn: 'fix-code-btn',
    getComplexityBtn: 'get-complexity-btn',
    infoMessage: 'info-message',
    analyzeCodeResponse: 'analyze-code-response',
    fixCodeResponse: 'fix-code-response',
    fixCodeContainer: 'fix-code-container',
    codeBtnContainer: 'code-btn-container',
    copyCodeBtn: 'copy-code-btn',
    clearCodeBtn: 'clear-code-btn',
    openSettingsBtn: 'open-settings-btn',
    loginBtn: 'login-btn',

};

/* Chrome storage keys */
const storageKeys: { [key: string]: string } = {
    analyzeCodeResponse: 'analyzeCodeResponse',
    fixCodeResponse: 'fixCodeResponse',
    lastAction: 'lastAction',
    currentLeetCodeProblemTitle: 'currentLeetCodeProblemTitle',
};

/* Retrieve elements from DOM */
const elements: { [key: string]: HTMLElement | null } = {};
for (const key in selectors) {
    if (key) elements[key] = document.getElementById(selectors[key]);
}


const analyzeCodeResponse = elements['analyzeCodeResponse'];
const fixCodeResponse = elements['fixCodeResponse'];
const infoMessage = elements['infoMessage'];
const fixCodeContainer = elements['fixCodeContainer'];

/* Helper functions */
function disableAllButtons(disabled: boolean): void {
    let fixCodeButton = elements['fixCodeBtn'] as HTMLButtonElement;
    let getComplexityButton = elements['getComplexityBtn'] as HTMLButtonElement;

    // Use the arguments to determine if a specific button should be disabled
    fixCodeButton && (fixCodeButton.disabled = disabled);
    getComplexityButton && (getComplexityButton.disabled = disabled);
}

function clearResponse(): void {
    if (analyzeCodeResponse) analyzeCodeResponse.textContent = '';
    if (fixCodeResponse) fixCodeResponse.textContent = '';
    if (fixCodeContainer) fixCodeContainer.classList.add('hidden');
    if (analyzeCodeResponse) analyzeCodeResponse.classList.add('hidden');
    chrome.storage.local.set({ 'fixCodeResponse': '' });
    chrome.storage.local.set({ 'analyzeCodeResponse': '' });
}

function setInfoMessage(message: string, duration: number) {
    if (!infoMessage) return;
    const oldMessage = infoMessage.textContent;
    infoMessage.textContent = message;
    setTimeout(() => {
        infoMessage.textContent = oldMessage;
    }, duration);
}

function initActionButton(buttonId: string, action: string, chatGPTProvider: AIProvider): void {
    const actionButton = document.getElementById(buttonId);
    if (!actionButton) return;
    actionButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            console.log(codeText);
            processCode(chatGPTProvider, codeText, action);
        } else {
            const errorMessage = "Cannot read from page. Please open a Leetcode problem and refresh the page.";
            setInfoMessage(errorMessage, 5000);
        }
    };
}

async function getCodeFromActiveTab(): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id as number,
                { type: 'getProblem' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        resolve(null);
                    } else {
                        resolve(response.data);
                    }
                },
            );
        });
    });
}

function timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${ms} ms`)), ms)
    );
}

function formatResponseText(text: string): string {
    return text
        .replace(/time/gi, '<span style="color: lightgreen;">time complexity</span>')
        .replace(/space/gi, '<span style="color: lightgreen;">space complexity</span>');
}

function stripMarkdownCodeBlock(text: string): string {
    // Remove any text between the first set of ```
    text = text.replace(/```[^\n]*\n/, '');
    // Remove trailing ```
    text = text.replace(/```$/, '');
    return text;
}

function processCode(
    chatGPTProvider: AIProvider,
    codeText: string,
    action: string,
): void {
    disableAllButtons(true);
    clearResponse();

    const problemTitle = infoMessage && infoMessage.textContent;

    let prompt = '';
    if (action === 'analyze') {
        // Prompt for getting code complexity
        prompt = `
        As an experienced software engineer, please analyze the code complexity of the Leetcode
        problem titled ${problemTitle} and the accompanying code below. The output (return value) of 
        the function should not be factored into the time and space complexity of the function.
        Return the time and space complexity of the function in big O notation. Your analysis should be direct and concise
        with no more than two sentences. The problem description and code are provided below\n. ${codeText}`;
        if (infoMessage) infoMessage.textContent = 'Analyzing code complexity ...';
        if (analyzeCodeResponse) analyzeCodeResponse.classList.remove('hidden');
        if (fixCodeContainer) fixCodeContainer.classList.add('hidden');
    }
    else if (action === 'fix') {
        console.log("Full context being sent to GPT:", codeText); // Debug log

        prompt = `
        You are a LeetCode solution generator. Fix the code for "${problemTitle}".
        If there's an error message, fix the specific issue mentioned in the error.
        
        RULES:
        - Provide ONLY raw solution code with NO markdown (Do NOT include "\`\`\`" or the language name)
        - Include ONLY the exact solution class and function definition LeetCode expects
        - NO explanations, comments, markdown formatting, examples, or test cases
        - The solution MUST be directly copy-pastable into LeetCode's editor
        
        Problem details and code:
        ${codeText}
        `;
        if (infoMessage) infoMessage.textContent = 'Generating solution code ...';
        analyzeCodeResponse && analyzeCodeResponse.classList.add('hidden');
        fixCodeContainer && fixCodeContainer.classList.remove('hidden');
    }

    let response = '';
    Promise.race([
        chatGPTProvider.generateAnswer({
            prompt: prompt,
            onEvent: (event: { type: string; data?: { text: string } }) => {
                if (event.type === 'answer' && event.data) {
                    if (action === 'fix' && fixCodeResponse) {
                        response += event.data.text;
                        fixCodeResponse.textContent = stripMarkdownCodeBlock(response); // Strip markdown code blocks
                        (window as any).Prism.highlightAll();
                    }
                    else if (action === 'analyze' && analyzeCodeResponse) {
                        response += formatResponseText(event.data.text); // Use the helper function here
                        analyzeCodeResponse.innerHTML = response;
                    }
                }
                if (event.type === 'done') {
                    disableAllButtons(false);
                    chrome.storage.local.set({ 'lastAction': action });
                    infoMessage && (infoMessage.textContent = problemTitle);
                    if (action === 'fix') {
                        fixCodeResponse && chrome.storage.local.set({ 'fixCodeResponse': fixCodeResponse.textContent });
                        (window as any).Prism.highlightAll();
                    }
                    if (action === 'analyze') {
                        analyzeCodeResponse && chrome.storage.local.set({ 'analyzeCodeResponse': analyzeCodeResponse.innerHTML });
                    }
                }
            },
        }),
        timeout(20000)
    ]).catch((error) => {
        infoMessage && (infoMessage.textContent = 'The request timed out. Please try again.');
        console.error(error);
        disableAllButtons(false);
    });
}

async function loadStoredData(): Promise<void> {
    const [analyzeCodeResponseStored, fixCodeResponseStored, lastAction] = await Promise.all([
        getFromStorage(storageKeys.analyzeCodeResponse),
        getFromStorage(storageKeys.fixCodeResponse),
        getFromStorage(storageKeys.lastAction),
    ]) as [string, string, string];

    if (analyzeCodeResponseStored && lastAction === 'analyze') {
        analyzeCodeResponse && (analyzeCodeResponse.innerHTML = analyzeCodeResponseStored);
        analyzeCodeResponse?.classList.remove('hidden');
    }

    if (fixCodeResponseStored && lastAction === 'fix') {
        fixCodeResponse && (fixCodeResponse.textContent = fixCodeResponseStored);
        fixCodeContainer?.classList.remove('hidden');
        (window as any).Prism.highlightAll();
    }
}

async function main(): Promise<void> {
    initializeTheme();
    await loadStoredData();

    // get name of current tab and set info message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.url && tab.url.includes('leetcode.com/problems')) {
            chrome.storage.local.set({ 'currentLeetCodeProblemTitle': tab.title });
            if (tab.title && infoMessage) {
                infoMessage.textContent = tab.title.split('-')[0];
            }
        }
    });

    elements['openSettingsBtn'] && (elements['openSettingsBtn'].onclick = () => {
        window.location.href = 'settings.html';
    });

    try {
        // Get OpenRouter API key from storage
        const data = await chrome.storage.local.get('openRouterApiKey');
        if (!data.openRouterApiKey) {
            displayApiKeyMessage();
            return;
        }

        // Verify API key is not empty string
        if (data.openRouterApiKey.trim() === '') {
            displayApiKeyMessage();
            return;
        }

        const openRouterProvider = new OpenRouterProvider(data.openRouterApiKey);
        initActionButton('get-complexity-btn', 'analyze', openRouterProvider);
        initActionButton('fix-code-btn', 'fix', openRouterProvider);
        initCopyButton();
        initClearButton();
        elements['getComplexityBtn']?.classList.remove('hidden');
        elements['fixCodeBtn']?.classList.remove('hidden');
    } catch (error) {
        handleError(error as Error);
    }
}

function displayApiKeyMessage(): void {
    elements['loginBtn']?.classList.remove('hidden');
    if (infoMessage) {
        infoMessage.textContent = 'Please add your OpenRouter API key in settings';
    }
    disableAllButtons(true);
}

function initCopyButton(): void {
    const copyButton = elements['copyCodeBtn'];
    if (!copyButton) return;
    copyButton.onclick = async () => {
        setInfoMessage('Copied Code', 3000);
        // change icon to check-icon.png
        copyButton
        if (fixCodeResponse && fixCodeResponse.textContent) {
            await navigator.clipboard.writeText(fixCodeResponse.textContent);
        }
    };
    copyButton.classList.remove('hidden');
}

function initClearButton(): void {
    const clearButton = elements['clearCodeBtn'];
    clearButton && (clearButton.onclick = async () => {
        setInfoMessage('Cleared Response', 3000);
        clearResponse();
    });
}

/* Error handling functions */
function handleError(error: Error): void {
    if (error.message === 'UNAUTHORIZED' || error.message === 'CLOUDFLARE') {
        displayLoginMessage();
    } else {
        console.error('Error:', error);
        displayErrorMessage(error.message);
    }
}

function displayLoginMessage(): void {
    elements['loginBtn'] && elements['loginBtn'].classList.remove('hidden');
    infoMessage && (infoMessage.textContent = 'Log onto ChatGPT in your browser to use features above');
}

function displayErrorMessage(error: string): void {
    infoMessage && (infoMessage.textContent = error);
}

/* Event listeners */
elements['loginBtn'] && (elements['loginBtn'].onclick = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_LOGIN_PAGE' });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'setTabInfo') {
        const urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
        if (message.url.match(urlPattern)) {
            infoMessage && (infoMessage.textContent = message.title);
        }
    }
});

/* Utility functions */
function getFromStorage(key: string): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (data) => resolve(data[key] || ''));
    });
}

/* Run the main function */
main();
