import { getChatGPTAccessToken } from './chatgpt/chatgpt.js';
var { browser } = require("webextension-polyfill-ts");

// Load JSON & default settings on install
browser.runtime.onInstalled.addListener(() => {
    // Load JSON file into storage
    const jsonUrl = browser.runtime.getURL('src/assets/data/leetcode_solutions.json');
    fetch(jsonUrl)
        .then((response) => response.json())
        .then((data) => {
            browser.storage.local.set({ leetcodeProblems: data });
        })
        .catch((error) => {
            console.error(error);
        });

    // Default settings
    browser.storage.local.set({ language: 'python' });
    browser.storage.local.set({ fontSize: 14 });
    browser.storage.local.set({ showCompanyTags: true });
    browser.storage.local.set({ showExamples: true });
    browser.storage.local.set({ showDifficulty: true });
    browser.storage.local.set({ clickedCompany: 'Amazon' });
});

browser.runtime.onMessage.addListener(
    function (request, _, sendResponse) {
        if (request.action == 'openSolutionVideo') {
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
                        browser.tabs.update(tabId, updateProperties);
                    }
                }
            });
            sendResponse({ result: 'Success' });
        }
    },
);

browser.runtime.onMessage.addListener((request) => {
    if (request.action === 'openCompanyPage') {
        browser.storage.local.set({ clickedCompany: request.company });
        browser.tabs.create({
            url: browser.runtime.getURL('src/problems-by-company/company.html'),
            active: true,
        }, function (tab) {
            // Keep a reference to the listener so it can be removed later
            const listener = function (tabId: number, changedProps: any) {
                // When the tab is done loading
                if (tabId == tab.id && changedProps.status == 'complete') {
                    browser.tabs.sendMessage(tabId, request);
                    // Remove the listener once the tab is loaded
                    browser.tabs.onUpdated.removeListener(listener);
                }
            };
            // Attach the listener
            browser.tabs.onUpdated.addListener(listener);
        });
    }
});

browser.runtime.onMessage.addListener((request: any) => {
    if (request.type === 'OPEN_LOGIN_PAGE') {
        browser.tabs.create({ url: 'https://chat.openai.com' });
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CHATGPT_ACCESS_TOKEN') {
        getChatGPTAccessToken().then((accessToken) => {
            sendResponse({ accessToken: accessToken });
        });
        return true;
    }
});

// If the user is on a Leetcode problem page, show the solution video or company tags.
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // If descriptions tab is opened or updated, update the description
    let urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/(description\/)?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            browser.tabs.get(tabId, (updatedTab) => {
                browser.tabs.sendMessage(tabId, { action: 'updateDescription', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }

    // If solutions tab is opened or updated, add the video
    urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            browser.tabs.get(tabId, (updatedTab) => {
                browser.tabs.sendMessage(tabId, { action: 'addVideo', title: updatedTab.title || 'title' });
            });
        }, 1000);
    }

    // If problem tab is opened or updated, update the current problem title
    urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
    if (changeInfo.status === 'complete' && tab.url && tab.url.match(urlPattern)) {
        setTimeout(() => {
            browser.storage.local.set({ 'currentLeetCodeProblemTitle': tab.title || 'title' });
        }, 1000);
    }
});
