chrome.webRequest.onCompleted.addListener(
    (details) => {
        const accessTokenHeader = details.responseHeaders.find((header) => header.name.toLowerCase() === 'access-token');
        if (accessTokenHeader) {
            const token = accessTokenHeader.value;
            chrome.storage.local.set({ accessToken: token });
        }
    },
    {
        urls: ['https://chat.openai.com/api/auth/session'],
        types: ['xmlhttprequest'],
    },
    ['responseHeaders']
);

function openLoginPage() {
    chrome.tabs.create({ url: 'https://chat.openai.com' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'OPEN_LOGIN_PAGE') {
        openLoginPage();
    }
});

// On extension install, store the JSON of leetcode problems in the storage API
chrome.runtime.onInstalled.addListener(() => {
    const jsonUrl = chrome.runtime.getURL('data/leetcode_solutions.json');

    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            // Store the JSON data in a global variable or a storage API
            chrome.storage.local.set({ leetcodeProblems: data }, () => {
            });
        })
        .catch(error => {
            console.error(error);
        });
});

// if the url is a leetcode solution page and the page is loaded, tell the content script to inject the video
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/.*/.test(tab.url)) {
        console.log('INJECTING VIDEO');
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'injectVideo', title: updatedTab.title || 'title' });
            });
        }, 500);
    }
});