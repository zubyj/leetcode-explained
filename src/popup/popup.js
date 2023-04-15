// popup.js
import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from "../background/chatgpt/chatgpt.js";

async function main() {
    try {
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            initAnalyzeCodeButton(new ChatGPTProvider(accessToken));
        } else {
            displayLoginMessage();
        }

        chrome.storage.local.get(["accessToken", "userMessage"], async ({ accessToken, userMessage }) => {
            if (accessToken) {
                initAnalyzeCodeButton(new ChatGPTProvider(accessToken));
                // Display the stored message if it exists
                if (userMessage) {
                    displayTimeComplexity(userMessage);
                }
            } else {
                displayLoginMessage();
            }
        });
    } catch (error) {
        handleError(error);
    }
    displayUserMessageFromStorage();
}

document.getElementById("login-button").onclick = () => {
    chrome.runtime.sendMessage({ type: "OPEN_LOGIN_PAGE" });
};

function handleError(error) {
    if (error.message === "UNAUTHORIZED") {
        displayLoginMessage();
    } else {
        console.error("Error:", error);
    }
}

function displayLoginMessage() {
    document.getElementById("login-button").classList.remove("hidden");
}

function displayUserMessageFromStorage() {
    chrome.storage.local.get(["userMessage"], (result) => {
        if (result.userMessage) {
            document.getElementById("user-message").textContent = result.userMessage;
        }
    });
}

function initAnalyzeCodeButton(chatGPTProvider) {
    const analyzeCodeButton = document.getElementById("analyze-button");
    analyzeCodeButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            processCode(chatGPTProvider, codeText);
        } else {
            displayUnableToRetrieveCodeMessage();
        }
    };
}

async function getCodeFromActiveTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "getCode" }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve(null);
                } else {
                    resolve(response.data);
                }
            });
        });
    });
}

async function processCode(chatGPTProvider, codeText) {
    let messageParts = [];
    document.getElementById("user-message").textContent = "";
    chatGPTProvider.generateAnswer({
        prompt: `Give me the time and space complexity of the following code, if it exists, in one short sentence.\n ${codeText}`,
        onEvent: (event) => {
            if (event.type === "answer") {
                messageParts.push(event.data.text);
                let currentMessage = messageParts.join("");
                displayTimeComplexity(currentMessage);
            } else if (event.type === "done") {
                let fullMessage = messageParts.join("");
                sendTextToContentScript(fullMessage);
                // Save the fullMessage to storage when the stream is done
                chrome.storage.local.set({ userMessage: fullMessage });
            }
        },
    });
}

function displayTimeComplexity(timeComplexity) {
    document.getElementById("user-message").textContent = timeComplexity;
}

function sendTextToContentScript(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "addText", data: text });
    });
}

function displayUnableToRetrieveCodeMessage() {
    document.getElementById("user-message").textContent =
        "Unable to retrieve code. Please navigate to a Leetcode problem page and try again.";
}

main();