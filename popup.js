import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from "./chatgpt.js";

async function main() {
    try {
        const accessToken = await getChatGPTAccessToken();
        chrome.storage.local.set({ accessToken });

        chrome.storage.local.get(["accessToken"], async ({ accessToken }) => {
            if (accessToken) {
                const chatGPTProvider = new ChatGPTProvider(accessToken);

                const analyzeCodeButton = document.getElementById("analyze-button");
                analyzeCodeButton.onclick = async () => {
                    const codeText = await getCodeFromActiveTab();
                    if (codeText) {
                        console.log(codeText);
                        chatGPTProvider.generateAnswer({
                            prompt: `What is the time and space complexity of the following code in one short sentence each?  \n ${codeText}`,
                            onEvent: (event) => {
                                if (event.type === 'answer') {
                                    document.getElementById('time-complexity').textContent = `${event.data.text}`;
                                }
                            },
                        });
                    }
                    else {
                        document.getElementById('time-complexity').textContent = 'Error: Unable to retrieve code';
                    }
                };


                document.body.appendChild(analyzeCodeButton);
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
                    console.error(chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(response.data);
                }
            });
        });
    });
}

main();
