import { getChatGPTAccessToken } from './chatgpt/chatgpt.js';

// Runs when the extension is installed
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
    chrome.storage.local.set({ showCompanyTags: true });
    chrome.storage.local.set({ showExamples: true });
    chrome.storage.local.set({ showDifficulty: true });
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
                    if (tabs.length > 0 && tabs[0].id) {
                        const tabId = tabs[0].id;
                        const updateProperties = { url: newUrl };
                        chrome.tabs.update(tabId, updateProperties);
                    }
                }
            });
            sendResponse({ result: "Success" });
        }
    }
);

chrome.runtime.onMessage.addListener((request: any) => {
    if (request.type === 'OPEN_LOGIN_PAGE') {
        chrome.tabs.create({ url: 'https://chat.openai.com' });
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openCompanyPage") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/popup/company.html"),
            active: true
        }, function (tab) {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
                // When the tab is done loading
                if (tabId == tab.id && changedProps.status == "complete") {
                    chrome.tabs.sendMessage(tabId, request);
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        });
    }
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // If descriptions tab is opened or updated, update the description
    let urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/(description\/)?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'updateDescription', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }

    // If solutions tab is opened or updated, add the video
    urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'addVideo', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }

    // If problem tab is opened or updated, update the current problem title
    urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            chrome.storage.local.set({ 'currentLeetCodeProblemTitle': tab.title || 'title' });
        }, 1000);
    }
});