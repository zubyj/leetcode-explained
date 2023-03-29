chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/.*/.test(tab.url)) {
        chrome.tabs.sendMessage(tabId, { action: 'injectVideo' });
    }
});