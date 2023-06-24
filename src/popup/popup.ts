import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

/* Element selectors */
const selectors = {
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
const storageKeys = {
    analyzeCodeResponse: 'analyzeCodeResponse',
    fixCodeResponse: 'fixCodeResponse',
    lastAction: 'lastAction',
    language: 'language',
    currentLeetCodeProblemTitle: 'currentLeetCodeProblemTitle',
};

/* Retrieve elements from DOM */
const elements = {};
for (let key in selectors) {
    elements[key] = document.getElementById(selectors[key]);
}

let analyzeCodeResponse = elements['analyzeCodeResponse'];
let fixCodeResponse = elements['fixCodeResponse'];
let infoMessage = elements['infoMessage'];
let fixCodeContainer = elements['fixCodeContainer'];

/* Helper functions */
function disableAllButtons(disabled: boolean): void {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button) => {
        button.disabled = disabled;
    });
}

function clearResponse(): void {
    analyzeCodeResponse.textContent = '';
    fixCodeResponse.textContent = '';
    fixCodeContainer!.classList.add('hidden');
    analyzeCodeResponse.classList.add('hidden');
    chrome.storage.local.set({ 'fixCodeResponse': '' });
    chrome.storage.local.set({ 'analyzeCodeResponse': '' });
}

function setInfoMessage(message: string, duration: number) {
    let oldMessage = infoMessage.textContent;
    infoMessage.textContent = message;
    setTimeout(() => {
        infoMessage.textContent = oldMessage;
    }, duration);
}

function initActionButton(buttonId: string, action: string, chatGPTProvider: ChatGPTProvider): void {
    const actionButton = document.getElementById(buttonId)!;
    actionButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            processCode(chatGPTProvider, codeText, action);
        } else {
            let errorMessage = 'Unable to retrieve code. Please navigate to a Leetcode problem page and refresh the page.';
            setInfoMessage(errorMessage, 5000);
        }
    };
}

async function getCodeFromActiveTab(): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id!,
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
    let problemTitle = infoMessage!.textContent;

    let prompt: string = "";
    if (action === "analyze") {
        prompt = `
        You are an expert software engineer.
        Given the Leetcode problem ${problemTitle} and the associated code below, analyze it concisely and directly.
        Provide the time complexity and the space complexity, both expressed in big O notation.
        Offer a brief explanation(1 - 2 lines max) for each complexity analysis. 
        Keep your analysis direct and succinct.
        `;
        infoMessage.textContent = 'Analyzing code complexity ...';
        analyzeCodeResponse.classList.remove('hidden');
        fixCodeContainer!.classList.add('hidden');
    }
    else if (action === "fix") {
        prompt = `
        ChatGPT, in your capacity as a coding expert, I need your assistance with a LeetCode problem titled ${problemTitle}.
        If only the function definition is provided, your task is to generate the optimal solution for this problem.
        Conversely, if the code is provided below, there is most likely error(s) in the code.
         Please correct any potential issues that is preventing the submission from being accepted.
        If the code I provide is already correct and optimized, return it as is.
        All code should be returned in plain text, with no usage of code blocks, and only essential inline comments are permitted.
        `;
        infoMessage.textContent = 'Creating the solution ...';
        analyzeCodeResponse.classList.add('hidden');
        fixCodeContainer!.classList.remove('hidden');
    }
    prompt += '\n Heres the code \n' + codeText;

    let response = '';
    chatGPTProvider.generateAnswer({
        prompt: prompt,
        onEvent: (event: { type: string; data?: { text: string } }) => {
            if (event.type === 'answer' && event.data) {
                response += event.data.text;
                if (action === "fix") {
                    fixCodeResponse.textContent = response;
                }
                else if (action === "analyze") {
                    analyzeCodeResponse.textContent = response;
                }
            }
            if (event.type === 'done') {
                chrome.storage.local.set({ 'analyzeCodeResponse': analyzeCodeResponse.textContent });
                chrome.storage.local.set({ 'fixCodeResponse': fixCodeResponse.textContent });
                chrome.storage.local.set({ 'lastAction': action });
                infoMessage.textContent = problemTitle;
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

            let width = parseInt(data.fontSize) * 30;
            document.body.style.width = `${width}px`;
            fixCodeContainer.style.width = `${width}px`;
            analyzeCodeResponse.style.width = `${width}px`;

            // set material-button padding to sclae with width
            // let buttons = document.getElementsByClassName("material-button");
            // for (let i = 0; i < buttons.length; i++) {
            //     let button = buttons[i] as HTMLElement;
            //     button.style.width = `${width / 2.2}px`;
            //     button.style.height = `${width / 10}px`;
            // }
        }
    });

    chrome.storage.local.get('analyzeCodeResponse', function (data) {
        if (data.analyzeCodeResponse) {
            analyzeCodeResponse.textContent = data.analyzeCodeResponse;
            (window as any).Prism.highlightAll();
        }
    });

    chrome.storage.local.get('fixCodeResponse', function (data) {
        if (data.fixCodeResponse) {
            fixCodeResponse.textContent = data.fixCodeResponse;
            (window as any).Prism.highlightAll();
        }
    });

    chrome.storage.local.get('lastAction', function (data) {
        if (data.lastAction) {
            if (data.lastAction === "analyze") {
                analyzeCodeResponse.classList.remove('hidden');
                fixCodeContainer.classList.add('hidden');
            }
            else if (data.lastAction === "fix") {
                analyzeCodeResponse.classList.add('hidden');
                fixCodeContainer!.classList.remove('hidden');
            }
        }
    });



    // get language from storage and set the classname of the code block to it
    chrome.storage.local.get('language', function (data) {
        fixCodeResponse.classList.add('language-' + data.language);
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
            elements['getComplexityBtn'].classList.remove('hidden');
            elements['fixCodeBtn'].classList.remove('hidden');
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
    copyButton.onclick = async () => {
        setInfoMessage('Copied Code', 3000);
        if (fixCodeResponse.textContent) {
            await navigator.clipboard.writeText(fixCodeResponse.textContent);
        }
    };
    copyButton.classList.remove('hidden');
}

// init clear code button
function initClearButton(): void {
    const clearButton = elements['clearCodeBtn']
    clearButton.onclick = async () => {
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
    elements['loginBtn'].classList.remove('hidden');
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
            infoMessage.textContent = message.title;
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