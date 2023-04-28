import {
    getChatGPTAccessToken,
    ChatGPTProvider,
} from "../background/chatgpt/chatgpt.js";

async function main() {
    try {
        const accessToken = await getChatGPTAccessToken();
        if (accessToken) {
            initAnalyzeCodeButton(new ChatGPTProvider(accessToken));
            document.getElementById("analyze-button").classList.remove("hidden");
        } else {
            displayLoginMessage();
        }
    } catch (error) {
        handleError(error);
    }
}

document.getElementById("login-button").onclick = () => {
    chrome.runtime.sendMessage({ type: "OPEN_LOGIN_PAGE" });
};

function handleError(error) {
    if (error.message === "UNAUTHORIZED" || error.message === "CLOUDFLARE") {
        displayLoginMessage();
    }
    else {
        console.error("Error:", error);
        displayErrorMessage(error.message);
    }
}

function displayLoginMessage() {
    document.getElementById("login-button").classList.remove("hidden");
    document.getElementById("user-message").textContent = "Get your code's time & space complexity with ChatGPT login";
}

function displayErrorMessage(error) {
    document.getElementById("user-message").textContent = error;
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

function processCode(chatGPTProvider, codeText) {
    document.getElementById("user-message").textContent = "";
    chatGPTProvider.generateAnswer({
        prompt: `Give me the time and space complexity of the following code, if it exists, in one short sentence.\n ${codeText}`,
        onEvent: (event) => {
            if (event.type === "answer") {
                displayTimeComplexity(event.data.text);
                sendTextToContentScript(event.data.text);
            }
        },
    });
}

function displayTimeComplexity(timeComplexity) {
    document.getElementById("user-message").append(timeComplexity);
}

function sendTextToContentScript(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "addText", data: text });
    });
}

function displayUnableToRetrieveCodeMessage() {
    document.getElementById("user-message").textContent =
        "Unable to retrieve code. Please navigate to a Leetcode problem page and refresh the page.";
}

main();