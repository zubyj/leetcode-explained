import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

let gptResponse = document.getElementById('gpt-response')!;
let infoMessage = document.getElementById('info-message')!;

function initActionButton(buttonId: string, action: string, chatGPTProvider: ChatGPTProvider): void {
    const actionButton = document.getElementById(buttonId)!;
    actionButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            processCode(chatGPTProvider, codeText, action);
        } else {
            displayUnableToRetrieveCodeMessage();
        }
    };
    document.getElementById(buttonId)!.classList.remove('hidden');
}

async function main(): Promise<void> {
    try {
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            const chatGPTProvider = new ChatGPTProvider(accessToken);
            initActionButton('get-complexity-btn', 'analyze', chatGPTProvider);
            initActionButton('fix-code-btn', 'fix', chatGPTProvider);
            initCopyButton();
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

document.getElementById('login-button')!.onclick = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_LOGIN_PAGE' });
};

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
    gptResponse!.textContent =
        'Log into ChatGPT in your browser to get started';
}

function displayErrorMessage(error: string): void {
    gptResponse!.textContent = error;
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
    let prompt: string;
    if (action === "analyze") {
        prompt = `
        What is the time and space complexity of the following code (if the code exists).\n
        ${codeText}`;
    } else if (action === "fix") {
        prompt = `Fix my code for the Leetcode problem and return only the fixed code. If no code is provided in the following text, provide one using Python.\n ${codeText}`;
    }
    chatGPTProvider.generateAnswer({
        prompt: prompt,
        onEvent: (event: { type: string; data?: { text: string } }) => {
            if (event.type === 'answer' && event.data) {
                gptResponse!.textContent += event.data.text;
                sendTextToContentScript(event.data.text);
            }
            if (event.type === 'done') {
                (window as any).Prism.highlightAll();
                const timeComplexity = gptResponse!.textContent;
                chrome.storage.local.set({ 'timeComplexity': timeComplexity });
            }
        },
    });
}

function sendTextToContentScript(text: string): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'addText', data: text });
    });
}

function displayUnableToRetrieveCodeMessage(): void {
    gptResponse!.textContent =
        'Unable to retrieve code. Please navigate to a Leetcode problem page and refresh the page.';
}

function initCopyButton(): void {
    const copyButton = document.getElementById('copy-code-btn')!;
    copyButton.onclick = async () => {
        const gptResponse = document.getElementById('gpt-response')!;
        if (gptResponse.textContent) {
            await navigator.clipboard.writeText(gptResponse.textContent);
        }
    };
    copyButton.classList.remove('hidden');
}

main();