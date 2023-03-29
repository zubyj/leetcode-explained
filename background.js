chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/.*/.test(tab.url)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'injectVideo', title: updatedTab.title || 'title' });
            });
        }, 500);
    }
});
