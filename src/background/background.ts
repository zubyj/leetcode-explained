import { getChatGPTAccessToken } from './chatgpt/chatgpt.js';

// Load JSON & default settings on install
chrome.runtime.onInstalled.addListener(() => {
    // Load JSON file into storage
    const leetcodeProblems = chrome.runtime.getURL('src/assets/data/leetcode_solutions.json');
    fetch(leetcodeProblems)
        .then((response) => response.json())
        .then((data) => {
            chrome.storage.local.set({ leetcodeProblems: data });
        })
        .catch((error) => {
            console.error(error);
        });

    // Default settings
    chrome.storage.local.set({ fontSize: 14 });
    chrome.storage.local.set({ showExamples: true });
    chrome.storage.local.set({ showDifficulty: true });
    chrome.storage.local.set({ showRating: true });
    chrome.storage.local.set({showCompanyTags: true });
});

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

// If the user is on a Leetcode problem page, show the solution video
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
                chrome.tabs.sendMessage(tabId, { action: 'updateSolutions', title: updatedTab.title || 'title' });
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
