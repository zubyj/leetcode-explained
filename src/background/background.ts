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
    chrome.storage.local.set({ fontSize: 12 }); // Default to small display size
    chrome.storage.local.set({ showExamples: true });
    chrome.storage.local.set({ showDifficulty: true });
    chrome.storage.local.set({ showRating: true });
    chrome.storage.local.set({ showCompanyTags: true });
    // Set default theme to auto mode and default to dark
    chrome.storage.local.set({ isDarkTheme: true }); // Default to dark theme
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

// Keep track of the last state to avoid duplicate updates
let lastState = {
    problemPath: '',
    view: '', // 'problem' or 'solutions'
    lastPathname: '', // Track full pathname to detect real navigation
    lastUrl: '', // Track full URL to detect refreshes
    lastUpdateTime: 0 // Track time of last update to prevent rapid re-triggers
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url) {
        const url = tab.url;
        let problemUrl = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
        
        // Check if this is a leetcode problem page
        if (url.match(problemUrl)) {
            // Extract the problem path from the URL
            const problemPath = url.match(/\/problems\/([^/]+)/)?.[1];
            const pathname = new URL(url).pathname;
            
            // Determine the current view - now only distinguishing between problem view and solutions
            let currentView = url.includes('/solutions') ? 'solutions' : 'problem';

            // Only trigger updates on actual page loads or problem changes
            const isPageLoad = changeInfo.status === 'complete';
            const isProblemChange = problemPath !== lastState.problemPath;
            const isViewChange = currentView !== lastState.view;
            
            // Check if this is a video navigation within solutions
            const isInternalSolutionsNavigation = 
                currentView === 'solutions' && 
                lastState.view === 'solutions' && 
                problemPath === lastState.problemPath;
            
            // Detect actual page refresh vs internal navigation
            const isActualRefresh = 
                url === lastState.lastUrl && 
                isPageLoad && 
                changeInfo.url === undefined && 
                !isInternalSolutionsNavigation &&
                Date.now() - lastState.lastUpdateTime > 1000;
            
            const isRealNavigation = 
                !isInternalSolutionsNavigation &&
                ((pathname !== lastState.lastPathname || isViewChange) && 
                !pathname.includes('playground') && 
                !pathname.includes('editor') &&
                !pathname.includes('interpret-solution') &&
                !pathname.includes('submissions'));

            // Update last URL and time
            if (!isInternalSolutionsNavigation) {
                lastState.lastUrl = url;
            }
            
            // Only update if there's a real navigation, problem change, or actual refresh
            if ((isProblemChange || (isViewChange && isRealNavigation) || isActualRefresh) && problemPath) {
                console.log(`State change detected - ${
                    isProblemChange ? 'New Problem' : 
                    isViewChange ? 'View Changed' : 
                    isActualRefresh ? 'Page Refresh' :
                    'Page Load'
                }`);
                
                // Update last state
                lastState.problemPath = problemPath;
                lastState.view = currentView;
                lastState.lastPathname = pathname;
                lastState.lastUpdateTime = Date.now();

                // Reset flags only on problem change or actual refresh
                if (isProblemChange || isActualRefresh) {
                    chrome.storage.local.set({
                        'currentLeetCodeProblem': problemPath,
                        'currentLeetCodeProblemTitle': tab.title,
                        'descriptionTabUpdated': false,
                        'solutionsTabUpdated': false
                    });
                }

                // Get current state
                chrome.storage.local.get(['descriptionTabUpdated', 'solutionsTabUpdated'], (result) => {
                    let descriptionTabUpdated = result.descriptionTabUpdated || false;
                    let solutionsTabUpdated = result.solutionsTabUpdated || false;

                    // Only update description if we're in problem view and not updated
                    if (!descriptionTabUpdated && currentView === 'problem') {
                        chrome.storage.local.set({ 'descriptionTabUpdated': true });
                        chrome.tabs.sendMessage(tabId, { action: 'updateDescription', title: tab.title || 'title' });
                    }

                    // Only update solutions if we're in solutions view and not updated or if view just changed to solutions
                    if ((!solutionsTabUpdated || (isViewChange && currentView === 'solutions')) && currentView === 'solutions') {
                        chrome.storage.local.set({ 'solutionsTabUpdated': true });
                        chrome.tabs.sendMessage(tabId, { action: 'updateSolutions', title: tab.title || 'title' });
                    }
                });
            }
        }
    }
});