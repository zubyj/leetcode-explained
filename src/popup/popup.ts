import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';


/* Global Variables */
let gptResponse: HTMLElement = document.getElementById('gpt-response')!;
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

    gptResponse!.textContent = '';
    analyzeCodeResponse!.textContent = '';
    fixCodeResponse!.textContent = '';

    let getComplexityOnClick = getComplexityBtn!.onclick;
    getComplexityBtn!.onclick = null;
    let fixCodeOnClick = fixCodeBtn.onclick;
    fixCodeBtn!.onclick = null;

    let prompt: string = '';
    if (action === "analyze") {
        prompt = `
        What is the time and space complexity of the following code (if the code exists).\n${codeText}`;
        infoMessage.textContent = 'Analyzing code complexity using ChatGPT ...'
        fixCodeResponse.classList.add('hidden');
        analyzeCodeResponse.classList.remove('hidden');
    }
    else if (action === "fix") {
        prompt = `
        Fix my code for the Leetcode problem and return only the fixed code without using a code block.
        If no code is provided in the following text, provide one using Python.\n ${codeText}`;
        infoMessage.textContent = 'Creating the solution using ChatGPT...'
        analyzeCodeResponse.classList.add('hidden');
        fixCodeResponse.classList.remove('hidden');
    }

    chatGPTProvider.generateAnswer({
        prompt: prompt,
        onEvent: (event: { type: string; data?: { text: string } }) => {
            if (event.type === 'answer' && event.data) {
                gptResponse!.textContent += event.data.text;
                analyzeCodeResponse.textContent = gptResponse!.textContent;
                fixCodeResponse.textContent = gptResponse!.textContent;
            }
            if (event.type === 'done') {
                infoMessage!.textContent = 'Done!';
                // set info message to the title of the current leetcode problem
                chrome.storage.local.get('currentLeetCodeProblemTitle', function (data) {
                    const title = data.currentLeetCodeProblemTitle;
                    infoMessage!.textContent = title;
                });
                chrome.storage.local.set({ 'gptResponse': gptResponse!.textContent });
                (window as any).Prism.highlightAll();
                getComplexityBtn!.onclick = getComplexityOnClick;
                fixCodeBtn!.onclick = fixCodeOnClick;
            }
        },
    });
}

async function main(): Promise<void> {
    chrome.storage.local.get('gptResponse', function (data) {
        if (data.gptResponse) {
            gptResponse.textContent = data.gptResponse;
            (window as any).Prism.highlightAll();
        }
    });

    setTimeout(() => {

        chrome.storage.local.get('currentLeetCodeProblemTitle', function (data) {
            const title = data.currentLeetCodeProblemTitle;
            infoMessage!.textContent = title;
        });
    }, 3000);

    try {
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            const chatGPTProvider = new ChatGPTProvider(accessToken);
            initActionButton('get-complexity-btn', 'analyze', chatGPTProvider);
            initActionButton('fix-code-btn', 'fix', chatGPTProvider);
            initCopyButton();
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
    const copyButton = document.getElementById('copy-code-btn')!;
    copyButton.onclick = async () => {
        if (gptResponse.textContent) {
            await navigator.clipboard.writeText(gptResponse.textContent);
        }
        infoMessage!.textContent = 'Copied to clipboard'
        setTimeout(() => {
            // set info message to the title of the current leetcode problem
            chrome.storage.local.get('currentLeetCodeProblemTitle', function (data) {
                const title = data.currentLeetCodeProblemTitle;
                infoMessage!.textContent = title;
            });
        }, 2000);
    };
    copyButton.classList.remove('hidden');
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