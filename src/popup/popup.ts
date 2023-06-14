import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

/* Global Variables */
let getComplexityBtn = document.getElementById('get-complexity-btn')!;
let fixCodeBtn = document.getElementById('fix-code-btn')!;
let infoMessage = document.getElementById('info-message')!;
let analyzeCodeResponse = document.getElementById('analyze-code-response')!;
let fixCodeResponse = document.getElementById('fix-code-response')!;

/* Helper functions */
function initActionButton(buttonId: string, action: string, chatGPTProvider: ChatGPTProvider): void {
    const actionButton = document.getElementById(buttonId)!;
    actionButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            processCode(chatGPTProvider, codeText, action);
        } else {
            infoMessage!.textContent =
                'Unable to retrieve code. Please navigate to a Leetcode problem page and refresh the page.';
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

    let getComplexityOnClick = getComplexityBtn!.onclick;
    getComplexityBtn!.onclick = null;
    let fixCodeOnClick = fixCodeBtn.onclick;
    fixCodeBtn!.onclick = null;

    fixCodeResponse.textContent = '';
    analyzeCodeResponse.textContent = '';

    let problemTitle = infoMessage!.textContent;

    let prompt: string = "As an expert software engineer, you are given the following code for the Leetcode problem titled " + problemTitle + ".\n";
    if (action === "analyze") {
        prompt += `
        Analyze the code complexity of the given code. 
        Using Big O notation, return the time complexity followed by the space complexity.
        Then, provide an explanation in a short & concise response.`;
        infoMessage.textContent = 'Analyzing code complexity using ChatGPT ...'
        analyzeCodeResponse.classList.remove('hidden');
        document.getElementById('fix-code-container')!.classList.add('hidden');
    }
    else if (action === "fix") {
        prompt += `
        Find and fix the bugs that prevent the submission from being accepted.
        If no code is provided, generate an optimal solution.
        If the given solution is already optimal, please let me know and return the original code.
        Return only the code in plain text format and without a code block`;
        infoMessage.textContent = 'Creating the solution using ChatGPT...';
        analyzeCodeResponse.classList.add('hidden');
        document.getElementById('fix-code-container')!.classList.remove('hidden');
    }
    prompt += '\n Ignore code comments Heres the code \n' + codeText;

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

                getComplexityBtn!.onclick = getComplexityOnClick;
                fixCodeBtn!.onclick = fixCodeOnClick;
                (window as any).Prism.highlightAll();
            }
        },
    });
}

async function main(): Promise<void> {
    chrome.storage.local.get('analyzeCodeResponse', function (data) {
        if (data.analyzeCodeResponse) {
            analyzeCodeResponse.textContent = data.analyzeCodeResponse;
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
                document.getElementById('fix-code-container')!.classList.add('hidden');
            }
            else if (data.lastAction === "fix") {
                analyzeCodeResponse.classList.add('hidden');
                document.getElementById('fix-code-container')!.classList.remove('hidden');
            }
        }
    });

    // get language from storage and set the classname of the code block to it
    chrome.storage.local.get('language', function (data) {
        if (data.language) {
            let codeBlock = document.getElementById('fix-code-response')!;
            // add class to code block called 'language-<language>'
            codeBlock.classList.add('language-' + data.language);

        }
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
            getComplexityBtn!.classList.remove('hidden');
            fixCodeBtn!.classList.remove('hidden');
        }
        else {
            displayLoginMessage();

        }
        document.getElementById('open-settings-btn')!.onclick = () => {
            window.location.href = 'settings.html';
        };
    }
    catch (error) {
        handleError(error as Error);
    }
}

function initCopyButton(): void {

    let message = infoMessage!.textContent;

    const copyButton = document.getElementById('copy-code-btn')!;
    copyButton.onclick = async () => {
        if (fixCodeResponse.textContent) {
            await navigator.clipboard.writeText(fixCodeResponse.textContent);
        }
        infoMessage!.textContent = 'Copied to clipboard'
        setTimeout(() => {
            infoMessage!.textContent = message;
        }, 1000);
    };
    copyButton.classList.remove('hidden');
}

// init clear code button
function initClearButton(): void {

    let message = infoMessage!.textContent;

    const clearButton = document.getElementById('clear-code-btn')!;
    clearButton.onclick = async () => {
        fixCodeResponse.textContent = '';
        analyzeCodeResponse.textContent = '';
        chrome.storage.local.set({ 'fixCodeResponse': '' });
        chrome.storage.local.set({ 'analyzeCodeResponse': '' });
    };
    infoMessage!.textContent = 'Response cleared';
    setTimeout(() => {
        infoMessage!.textContent = message;
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
    document.getElementById('login-button')!.classList.remove('hidden');
    infoMessage!.textContent =
        'Log into ChatGPT in your browser to get started';
}

function displayErrorMessage(error: string): void {
    infoMessage!.textContent = error;
}

/* Event listeners */
document.getElementById('login-button')!.onclick = () => {
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

/* Run the main function */
main();