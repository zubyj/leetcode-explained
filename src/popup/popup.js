import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from "../background/chatgpt/chatgpt.js";

async function main() {
    []
    try {
        const accessToken = await getChatGPTAccessToken();
        chrome.storage.local.set({ accessToken });

        chrome.storage.local.get(["accessToken"], async ({ accessToken }) => {
            if (accessToken) {
                const chatGPTProvider = new ChatGPTProvider(accessToken);

                document.getElementById('chat-section').classList.remove('hidden');
                const analyzeCodeButton = document.getElementById("analyze-button");
                analyzeCodeButton.onclick = async () => {
                    const codeText = await getCodeFromActiveTab();
                    if (codeText) {
                        chatGPTProvider.generateAnswer({
                            prompt: `Give me the time and space complexity of the following code, if it exists, in one short sentence.  \n ${codeText}`,
                            onEvent: (event) => {
                                if (event.type === 'answer') {
                                    document.getElementById('time-complexity').textContent = `${event.data.text}`;
                                    // tell the content script to add text onto the view-lines div
                                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                        chrome.tabs.sendMessage(tabs[0].id, { type: 'addText', data: event.data.text });
                                    }
                                    );
                                }
                            },
                        });
                    }
                    else {
                        document.getElementById('time-complexity').textContent = 'Unable to retrieve code. Please navigate to a Leetcode problem page and try again.';
                    }
                };
            } else {
                displayLoginMessage();
            }
        });
    } catch (error) {
        if (error.message === 'UNAUTHORIZED') {
            displayLoginMessage();
        } else {
            console.error("Error:", error);
        }
    }
}

function displayLoginMessage() {
    const error = document.createElement('p');
    error.textContent = 'Please login at ';

    const loginButton = document.createElement('button');
    loginButton.textContent = 'chat.openai.com';
    loginButton.onclick = () => {
        chrome.runtime.sendMessage({ type: 'OPEN_LOGIN_PAGE' });
    };

    error.appendChild(loginButton);
    document.body.appendChild(error);
}

async function getCodeFromActiveTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'getCode' }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve(null);
                } else {
                    resolve(response.data);
                }
            });
        });
    });
}

main();
