chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = tab.url;
        let problemUrl = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
        if (url.match(problemUrl)) {
            chrome.storage.local.get(['currentLeetCodeProblemTitle'], (result) => {
                let lastTitle = result.currentLeetCodeProblemTitle || '';
                
                // If the title has changed, we need to update both tabs
                if (tab.title !== lastTitle) {
                    chrome.storage.local.set({
                        'currentLeetCodeProblemTitle': tab.title,
                        'descriptionTabUpdated': false,
                        'solutionsTabUpdated': false
                    });

                    // Force update both tabs when problem changes
                    chrome.tabs.sendMessage(tabId, { 
                        action: 'updateDescription', 
                        title: tab.title || 'title',
                        forceUpdate: true 
                    });
                    chrome.tabs.sendMessage(tabId, { 
                        action: 'updateSolutions', 
                        title: tab.title || 'title',
                        forceUpdate: true 
                    });
                } else {
                    // If we're on the same problem but URL changed, update appropriate tab
                    let descriptionUrl = /^https:\/\/leetcode\.com\/problems\/.*\/(description\/)?/;
                    let solutionsUrl = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/;

                    if (url.match(descriptionUrl)) {
                        chrome.tabs.sendMessage(tabId, { 
                            action: 'updateDescription', 
                            title: tab.title || 'title' 
                        });
                    }

                    if (url.match(solutionsUrl)) {
                        chrome.tabs.sendMessage(tabId, { 
                            action: 'updateSolutions', 
                            title: tab.title || 'title' 
                        });
                    }
                }
            });
        }
    }
});

