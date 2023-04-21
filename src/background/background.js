import {getChatGPTAccessToken} from './chatgpt/chatgpt.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'OPEN_LOGIN_PAGE') {
        chrome.tabs.create({ url: 'https://chat.openai.com' });
    }
});

// On extension install, store the JSON of leetcode problems in local storage
chrome.runtime.onInstalled.addListener(() => {
    const jsonUrl = chrome.runtime.getURL('assets/data/leetcode_solutions.json');

    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            // Store the JSON data in a global variable or a storage API
            chrome.storage.local.set({ leetcodeProblems: data });
        })
        .catch(error => {
            console.error(error);
        });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'addVideo', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CHATGPT_ACCESS_TOKEN') {
        getChatGPTAccessToken().then((accessToken) => {
            sendResponse({ accessToken: accessToken });
        });
        return true; // Indicates the response will be sent asynchronously
    }
});
