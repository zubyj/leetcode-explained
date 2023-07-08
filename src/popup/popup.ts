/*
The logic behind the popup window that appears when the extension icon is clicked.
Creates the GPT buttons, sets the prompts, and displays the responses.
The user can also copy the code to their clipboard, clear the code, and open the settings page.
*/

import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

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
    language: 'language',
    currentLeetCodeProblemTitle: 'currentLeetCodeProblemTitle',
};

/* Retrieve elements from DOM */
const elements: { [key: string]: HTMLElement | null } = {};
for (const key in selectors) {
    elements[key] = document.getElementById(selectors[key]);
}

const analyzeCodeResponse = elements['analyzeCodeResponse'];
const fixCodeResponse = elements['fixCodeResponse'];
const infoMessage = elements['infoMessage'];
const fixCodeContainer = elements['fixCodeContainer'];

/* Helper functions */
function disableAllButtons(disabled: boolean): void {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button) => {
        button.disabled = disabled;
    });
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
            const errorMessage = 'Unable to retrieve code. Please navigate to a Leetcode problem page and refresh the page.';
            setInfoMessage(errorMessage, 5000);
        }
    };
}

async function getCodeFromActiveTab(): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id as number,
                { type: 'getCode' },
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

function processCode(
    chatGPTProvider: ChatGPTProvider,
    codeText: string,
    action: string,
): void {
    disableAllButtons(true);
    clearResponse();

    const problemTitle = infoMessage!.textContent;

    let prompt: string = '';
    if (action === 'analyze') {
        prompt = `
        As an experienced software engineer, please analyze the Leetcode problem titled ${problemTitle} and the accompanying code below.
        Your analysis should be concise and straightforward, providing both time and space complexity in big O notation.
        Please include a brief, concise explanation (no more than 1-2 lines) for each complexity analysis.
        Space complexity should not include the output (return value) of the function.
        Your analysis should be direct and to the point. 
        The code is provided below.`;


        if (infoMessage) infoMessage.textContent = 'Analyzing code complexity ...';
        if (analyzeCodeResponse) analyzeCodeResponse.classList.remove('hidden');
        if (fixCodeContainer) fixCodeContainer.classList.add('hidden');
    }
    else if (action === 'fix') {
        prompt = `
        As a coding expert, I require your aid with a specific LeetCode problem called ${problemTitle}.
        If you are given only the function definition, your task is to generate the best possible solution for this problem.
        On the other hand, if the code is already provided, there may be some errors that are preventing it from being accepted.
        Please identify and fix any potential issues in the code.
        If the provided code is already correct and optimized, please return it as is.
        All code should be returned in plain text format, with no usage of code blocks.
        Anything other than the code text is not permitted.
        The code is provided below.`;
        if (infoMessage) infoMessage.textContent = 'Creating the solution ...';
        analyzeCodeResponse!.classList.add('hidden');
        fixCodeContainer!.classList.remove('hidden');
    }
    prompt += '\n' + codeText;

    let response = '';
    chatGPTProvider.generateAnswer({
        prompt: prompt,
        onEvent: (event: { type: string; data?: { text: string } }) => {
            if (event.type === 'answer' && event.data) {
                response += event.data.text;
                if (action === 'fix' && fixCodeResponse) {
                    fixCodeResponse.textContent = response;
                }
                else if (action === 'analyze' && analyzeCodeResponse) {
                    analyzeCodeResponse.textContent = response;
                }
            }
            if (event.type === 'done') {
                chrome.storage.local.set({ 'analyzeCodeResponse': analyzeCodeResponse!.textContent });
                chrome.storage.local.set({ 'fixCodeResponse': fixCodeResponse!.textContent });
                chrome.storage.local.set({ 'lastAction': action });
                infoMessage!.textContent = problemTitle;
                disableAllButtons(false);
                (window as any).Prism.highlightAll();
            }
        },
    });
}

async function main(): Promise<void> {

    await Promise.all([
        getFromStorage(storageKeys.analyzeCodeResponse),
        getFromStorage(storageKeys.fixCodeResponse),
        getFromStorage(storageKeys.lastAction),
        getFromStorage(storageKeys.language),
    ]);

    let fontSizeElement = document.documentElement; // Or any specific element you want to change the font size of

    // Load font size from storage
    chrome.storage.local.get('fontSize', function (data) {
        if (data.fontSize) {
            // Setting CSS variable --dynamic-font-size with the loaded value
            fontSizeElement.style.setProperty('--dynamic-font-size', `${data.fontSize}px`);

            if (parseInt(data.fontSize) >= 18) {
                let width = (parseInt(data.fontSize) * 24 + 200);
                document.body.style.width = `${width + 20}px`;
                fixCodeContainer!.style.maxWidth = `${width}px`;
                analyzeCodeResponse!.style.maxWidth = `${width}px`;
            }

            let sizes = document.getElementsByClassName('material-button');
            for (let i = 0; i < sizes.length; i++) {
                (sizes[i] as HTMLElement).style.width = `${data.fontSize * 13}px`;
            }
        }
    });

    chrome.storage.local.get('analyzeCodeResponse', function (data) {
        if (data.analyzeCodeResponse) {
            analyzeCodeResponse!.textContent = data.analyzeCodeResponse;
            (window as any).Prism.highlightAll();
        }
    });

    chrome.storage.local.get('fixCodeResponse', function (data) {
        if (data.fixCodeResponse) {
            fixCodeResponse!.textContent = data.fixCodeResponse;
            (window as any).Prism.highlightAll();
        }
    });

    chrome.storage.local.get('lastAction', function (data) {
        if (data.lastAction) {
            if (data.lastAction === "analyze") {
                analyzeCodeResponse!.classList.remove('hidden');
                fixCodeContainer!.classList.add('hidden');
            }
            else if (data.lastAction === "fix") {
                analyzeCodeResponse!.classList.add('hidden');
                fixCodeContainer!.classList.remove('hidden');
            }
        }
    });

    // get language from storage and set the classname of the code block to it
    chrome.storage.local.get('language', function (data) {
        fixCodeResponse!.classList.add('language-' + data.language);
    });

    // get name of current tab and set info message to it if its a leetcode problem
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.url!.includes('leetcode.com/problems')) {
            chrome.storage.local.set({ 'currentLeetCodeProblemTitle': tab.title });
            if (tab.title) {
                infoMessage!.textContent = tab.title?.split('-')[0];
            }
        }
    });

    try {
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            const chatGPTProvider = new ChatGPTProvider(accessToken);
            initActionButton('get-complexity-btn', 'analyze', chatGPTProvider);
            initActionButton('fix-code-btn', 'fix', chatGPTProvider);
            initCopyButton();
            initClearButton();
            elements['getComplexityBtn']!.classList.remove('hidden');
            elements['fixCodeBtn']!.classList.remove('hidden');
        }
        else {
            displayLoginMessage();

        }
        elements['openSettingsBtn']!.onclick = () => {
            window.location.href = 'settings.html';
        };
    }
    catch (error) {
        handleError(error as Error);
    }
}

function initCopyButton(): void {
    const copyButton = elements['copyCodeBtn'];
    copyButton!.onclick = async () => {
        setInfoMessage('Copied Code', 3000);
        if (fixCodeResponse!.textContent) {
            await navigator.clipboard.writeText(fixCodeResponse!.textContent);
        }
    };
    copyButton!.classList.remove('hidden');
}

// init clear code button
function initClearButton(): void {
    const clearButton = elements['clearCodeBtn']
    clearButton!.onclick = async () => {
        setInfoMessage('Cleared Response', 3000);
        clearResponse();
    };
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
    elements['loginBtn']!.classList.remove('hidden');
    infoMessage!.textContent =
        'Log into ChatGPT in your browser to get started';
}

function displayErrorMessage(error: string): void {
    infoMessage!.textContent = error;
}

/* Event listeners */
elements['loginBtn']!.onclick = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_LOGIN_PAGE' });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setTabInfo') {
        const urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
        if (message.url.match(urlPattern)) {
            infoMessage!.textContent = message.title;
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