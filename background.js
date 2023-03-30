chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/.*/.test(tab.url)) {
        setTimeout(() => {
            chrome.tabs.get(tabId, (updatedTab) => {
                chrome.tabs.sendMessage(tabId, { action: 'injectVideo', title: updatedTab.title || 'title' });
            });
        }, 500);
    }
});


chrome.runtime.onInstalled.addListener(() => {
    const jsonUrl = chrome.runtime.getURL('data/leetcode_problems.json');

    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            // Store the JSON data in a global variable or a storage API
            chrome.storage.local.set({ leetcodeProblems: data }, () => {
                console.log('data stored');
            });
            console.log(data);
        })
        .catch(error => {
            console.error(error);
        });
});
