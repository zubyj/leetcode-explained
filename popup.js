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
                const prompt = "how are you";

                const requestButton = document.createElement("button");
                requestButton.textContent = "Request ChatGPT";
                requestButton.onclick = async () => {
                    const responseDiv = document.createElement("div");
                    document.body.appendChild(responseDiv);

                    chatGPTProvider.generateAnswer({
                        prompt,
                        onEvent: (event) => {
                            if (event.type === "answer") {
                                responseDiv.textContent = `Answer: ${event.data.text}`;
                            }
                        },
                    });
                };

                document.body.appendChild(requestButton);
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

main();
