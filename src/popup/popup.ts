import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

let gptResponse = document.getElementById('gpt-response')!;

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
    gptResponse!.innerText = '';
    let prompt: string;
    if (action === "analyze") {
        prompt = `
        Return the time and space complexity of the following code, if it exists.\n 
        Keep the response as short as possible.
        The answer should be in the form of "Time complexity: O(n), Space complexity: O(n)"\n    
        ${codeText}`;
    } else if (action === "fix") {
        prompt = `Fix my code and return only the fixed code\n ${codeText}`;
    }
    chatGPTProvider.generateAnswer({
        prompt: prompt,
        onEvent: (event: { type: string; data?: { text: string } }) => {
            if (event.type === 'answer' && event.data) {
                gptResponse!.innerText += event.data.text;
                sendTextToContentScript(event.data.text);
            }
        },
    });
    // Set a delay to store timeComplexity after the onEvent function is done processing
    setTimeout(() => {
        const timeComplexity = gptResponse!.innerText;
        chrome.storage.local.set({ 'timeComplexity': timeComplexity });
    }, 4000);
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

main();