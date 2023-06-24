import { getChatGPTAccessToken } from './chatgpt/chatgpt.js';

chrome.runtime.onMessage.addListener((request: any) => {
    if (request.type === 'OPEN_LOGIN_PAGE') {
        chrome.tabs.create({ url: 'https://chat.openai.com' });
    }
});

chrome.runtime.onMessage.addListener((request: any) => {
    if (request.type === 'OPEN_LOGIN_PAGE') {
        chrome.tabs.create({ url: 'https://chat.openai.com' });
    }
});

chrome.runtime.onInstalled.addListener(() => {
    const jsonUrl = chrome.runtime.getURL('src/assets/data/leetcode_solutions.json');
    fetch(jsonUrl)
        .then((response) => response.json())
        .then((data) => {
            chrome.storage.local.set({ leetcodeProblems: data });
        })
        .catch((error) => {
            console.error(error);
        });
    chrome.storage.local.set({ language: 'python' });
    chrome.storage.local.set({ fontSize: 14 });
    chrome.storage.local.set({ hideTags: false });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action == "openSolutionVideo") {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                let url = tabs[0].url;
                if (url) {
                    // Remove /description/ if it exists
                    url = url.replace(/\/description\//, '/');
                    // Ensure the URL ends with /
                    if (!url.endsWith('/')) {
                        url += '/';
                    }
                    // Append solutions/
                    const newUrl = url + 'solutions/';
                    chrome.tabs.update(tabs[0].id, { url: newUrl });
                }
            });

            sendResponse({ result: "Success" });
        }
    }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    let urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/(description\/)?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'addCompanies', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }

    urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'addVideo', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }

    urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.storage.local.set({ 'currentLeetCodeProblemTitle': tab.title || 'title' });
        }, 1000);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CHATGPT_ACCESS_TOKEN') {
        getChatGPTAccessToken().then((accessToken) => {
            sendResponse({ accessToken: accessToken });
        });
        return true;
    }
});
