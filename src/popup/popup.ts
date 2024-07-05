/*
Contains the logic behind the popup window that appears when the extension icon is clicked.
Creates the GPT buttons, sets the prompts, and displays the responses.
The user can also copy the code to their clipboard, clear the code, and open the settings page.
*/

import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

import { initializeTheme, toggleTheme } from '../utils/theme.js';

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
    let fixCodeButton = elements['fixCodeBtn'];
    let getComplexityButton = elements['getComplexityBtn'];

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

function initActionButton(buttonId: string, action: string, chatGPTProvider: ChatGPTProvider): void {
    const actionButton = document.getElementById(buttonId);
    if (!actionButton) return;
    actionButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
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

function processCode(
    chatGPTProvider: ChatGPTProvider,
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

        // Prompt for generating solution code
        prompt = `
        As a coding professional, I need your expertise with a specific LeetCode problem named ${problemTitle}.
        Please follow the instructions:
        1. If no code is provided: Generate an efficient and accurate solution for the problem.
        2. If code is provided and contains errors: Identify the issues, correct them, and optimize the code if possible.
        3. If the provided code is already correct and optimized: Simply return it as-is.
        IMPORTANT: Your response should only include the function definition and code solution in plain text format (no backticks, code blocks, or additional formatting).
        Do not explain your solution or provide any additional information other than the code.
        Here's the problem description and code:\n
        ${codeText}
        `
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
                        fixCodeResponse.textContent = response;
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

async function main(): Promise<void> {

    initializeTheme();

    await Promise.all([
        getFromStorage(storageKeys.analyzeCodeResponse),
        getFromStorage(storageKeys.fixCodeResponse),
        getFromStorage(storageKeys.lastAction),
        getFromStorage(storageKeys.language),
    ]);

    // Load font size from storage
    let fontSizeElement = document.documentElement; // Or any specific element you want to change the font size of
    chrome.storage.local.get('fontSize', function (data) {
        if (data.fontSize) {
            fontSizeElement.style.setProperty('--dynamic-font-size', `${data.fontSize}px`);
            if (parseInt(data.fontSize) >= 18) {
                const width = (parseInt(data.fontSize) * 24 + 200);
                document.body.style.width = `${width + 20} px`;
                fixCodeContainer && (fixCodeContainer.style.maxWidth = `${width} px`);
                analyzeCodeResponse && (analyzeCodeResponse.style.maxWidth = `${width}px`);
            }

            const sizes = document.getElementsByClassName('material-button');
            for (let i = 0; i < sizes.length; i++) {
                (sizes[i] as HTMLElement).style.width = `${data.fontSize * 13} px`;
            }
        }
    });

    chrome.storage.local.get('analyzeCodeResponse', function (data) {
        if (data.analyzeCodeResponse) {
            analyzeCodeResponse && (analyzeCodeResponse.innerHTML = data.analyzeCodeResponse);
            (window as any).Prism.highlightAll();
        }
    });

    chrome.storage.local.get('fixCodeResponse', function (data) {
        if (data.fixCodeResponse) {
            fixCodeResponse && (fixCodeResponse.textContent = data.fixCodeResponse);
            (window as any).Prism.highlightAll();
        }
    });

    chrome.storage.local.get('lastAction', function (data) {
        if (data.lastAction) {
            if (data.lastAction === 'analyze') {
                analyzeCodeResponse && analyzeCodeResponse.classList.remove('hidden');
                fixCodeContainer && fixCodeContainer.classList.add('hidden');
            }
            else if (data.lastAction === 'fix') {
                analyzeCodeResponse && analyzeCodeResponse.classList.add('hidden');
                fixCodeContainer && fixCodeContainer.classList.remove('hidden');
            }
        }
    });

    // get name of current tab and set info message to it if its a leetcode problem
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
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            const chatGPTProvider = new ChatGPTProvider(accessToken);
            initActionButton('get-complexity-btn', 'analyze', chatGPTProvider);
            initActionButton('fix-code-btn', 'fix', chatGPTProvider);
            initCopyButton();
            initClearButton();
            elements['getComplexityBtn'] && elements['getComplexityBtn'].classList.remove('hidden');
            elements['fixCodeBtn'] && elements['fixCodeBtn'].classList.remove('hidden');
        }
        else {
            displayLoginMessage();
        }
    }
    catch (error) {
        handleError(error as Error);
    }
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
function getFromStorage(key: string) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (data) => resolve(data[key]));
    });
}

/* Run the main function */
main();
