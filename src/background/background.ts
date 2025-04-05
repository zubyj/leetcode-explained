// Helper function to get or create user ID
function getRandomToken(): string {
    const randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    return Array.from(randomPool)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Load problem data & default settings on install
chrome.runtime.onInstalled.addListener(() => {
    // Generate and store user ID if it doesn't exist
    chrome.storage.sync.get('userId', function (items) {
        if (!items.userId) {
            const userId = getRandomToken();
            chrome.storage.sync.set({ userId: userId });
        }
    });

    // Load JSON file of problem data into storage
    const leetcodeProblems = chrome.runtime.getURL('src/assets/data/problem_data.json');
    fetch(leetcodeProblems)
        .then((response) => response.json())
        .then((data) => {
            chrome.storage.local.set({ leetcodeProblems: data });
        })
        .catch((error) => {
            console.error(error);
        });

    // Load problems by company JSON file into storage
    const companyProblems = chrome.runtime.getURL('src/assets/data/problems_by_company.json');
    fetch(companyProblems)
        .then((response) => response.json())
        .then((data) => {
            chrome.storage.local.set({ companyProblems: data });
        })
        .catch((error) => {
            console.error(error);
        });

    // Load default settings
    chrome.storage.local.set({ fontSize: 14 });
    chrome.storage.local.set({ showExamples: true });
    chrome.storage.local.set({ showDifficulty: true });
    chrome.storage.local.set({ showRating: true });
    chrome.storage.local.set({ showCompanyTags: true });
    // Set default theme to auto mode - isDarkTheme will be determined by LeetCode's theme
    chrome.storage.local.set({ isDarkTheme: false }); // Default value, will be updated by auto-detection
    chrome.storage.local.set({ themeMode: 'auto' });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'openCompanyPage') {
        chrome.storage.local.set({ clickedCompany: request.company });
        chrome.tabs.create({
            url: chrome.runtime.getURL('src/problems-by-company/company.html'),
            active: true,
        }, function (tab) {
            // Remove the listener once the tab is loaded
            const listener = function (tabId: number, changedProps: any) {
                if (tabId == tab.id && changedProps.status == 'complete') {
                    chrome.tabs.sendMessage(tabId, request);
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            // Attach the listener
            chrome.tabs.onUpdated.addListener(listener);
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = tab.url;
        let problemUrl = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
        if (url.match(problemUrl)) {
            chrome.storage.local.get(['currentLeetCodeProblemTitle', 'descriptionTabUpdated', 'solutionsTabUpdated'], (result) => {
                let lastTitle = result.currentLeetCodeProblemTitle || '';
                let descriptionTabUpdated = result.descriptionTabUpdated || false;
                let solutionsTabUpdated = result.solutionsTabUpdated || false;
                if (tab.title !== lastTitle) {
                    chrome.storage.local.set({
                        'currentLeetCodeProblemTitle': tab.title,
                        'descriptionTabUpdated': false,
                        'solutionsTabUpdated': false
                    });
                    // If the title has changed, we reset both flags
                    descriptionTabUpdated = false;
                    solutionsTabUpdated = false;
                }

                let descriptionUrl = /^https:\/\/leetcode\.com\/problems\/.*\/(description\/)?/;
                if (!descriptionTabUpdated && url.match(descriptionUrl)) {
                    chrome.storage.local.set({ 'descriptionTabUpdated': true });
                    chrome.tabs.sendMessage(tabId, { action: 'updateDescription', title: tab.title || 'title' });
                }

                let solutionsUrl = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/;
                if (url.match(solutionsUrl)) {
                    chrome.storage.local.set({ 'solutionsTabUpdated': true });
                    chrome.tabs.sendMessage(tabId, { action: 'updateSolutions', title: tab.title || 'title' });
                }
            });
        }
    }
});

