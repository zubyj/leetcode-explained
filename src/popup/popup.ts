import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from '../background/chatgpt/chatgpt.js';

async function main(): Promise<void> {
    try {
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            initAnalyzeCodeButton(new ChatGPTProvider(accessToken));
            document.getElementById('analyze-button')!.classList.remove('hidden');
        } else {
            displayLoginMessage();
        }
    } catch (error) {
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
    document.getElementById('user-message')!.textContent =
        'Get your codes time & space complexity with ChatGPT login';
}

function displayErrorMessage(error: string): void {
    document.getElementById('user-message')!.textContent = error;
}

function initAnalyzeCodeButton(chatGPTProvider: ChatGPTProvider): void {
    const analyzeCodeButton = document.getElementById('analyze-button')!;
    analyzeCodeButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            processCode(chatGPTProvider, codeText);
        } else {
            displayUnableToRetrieveCodeMessage();
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
): void {
    document.getElementById('user-message')!.textContent = '';
    chatGPTProvider.generateAnswer({
        prompt: `Give me the time and space complexity of the following code, if it exists, in one short sentence.\n ${codeText}`,
        onEvent: (event: { type: string; data?: { text: string } }) => {
            if (event.type === 'answer' && event.data) {
                displayTimeComplexity(event.data.text);
                sendTextToContentScript(event.data.text);
            }
        },
    });
}


function displayTimeComplexity(timeComplexity: string): void {
    document.getElementById('user-message')!.append(timeComplexity);
}

function sendTextToContentScript(text: string): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'addText', data: text });
    });
}

function displayUnableToRetrieveCodeMessage(): void {
    document.getElementById('user-message')!.textContent =
        'Unable to retrieve code. Please navigate to a Leetcode problem page and refresh the page.';
}

window.onload = () => {
    chrome.storage.local.get('fontSize', (data) => {
        document.body.style.fontSize = data.fontSize + 'px';
    });
};

document.getElementById('open-settings-btn')!.onclick = () => {
    window.location.href = 'settings.html';
};

main();
