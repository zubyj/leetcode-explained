// shows the examples if the user has enabled it in the settings
function showExamples() {
    // Check if we're on the description tab before proceeding
    const isDescriptionPage = !window.location.href.includes('/solutions');
    if (!isDescriptionPage) {
        return;
    }

    chrome.storage.local.get(['showExamples'], (result) => {
        const showExamples = result.showExamples;
        const examples = document.querySelectorAll('div.flex.h-full.w-full')[0];
        if (!examples) return;
        let preTags = examples.getElementsByTagName('pre');
        if (preTags) {
            Array.from(preTags).forEach(tag => {
                tag.style.display = showExamples ? 'block' : 'none';
            });
        }
    });
}

// Define the Problem interface
interface Problem {
    title: string;
    rating?: string;
    companies?: Array<{
        name: string;
    }>;
}

// Detect LeetCode's theme and set extension theme accordingly
function detectAndSyncTheme() {
    chrome.storage.local.get(['themeMode'], (result) => {
        // Only sync theme if in auto mode
        if (result.themeMode !== 'auto') {
            return;
        }
        
        // Get the current LeetCode theme from HTML tag
        const htmlElement = document.documentElement;
        const leetcodeTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
        
        // Set the extension theme based on LeetCode's theme
        chrome.storage.local.set({ 
            isDarkTheme: leetcodeTheme === 'dark'
        });
        
        //console.log(`Theme auto-detected: ${leetcodeTheme}`);
        
        // Set up observer for future theme changes
        observeThemeChanges();
    });
}

// Observe theme changes in LeetCode and update extension theme
function observeThemeChanges() {
    chrome.storage.local.get(['themeMode'], (result) => {
        // Only observe changes if theme mode is set to 'auto'
        if (result.themeMode !== 'auto') {
            return;
        }
        
        const htmlElement = document.documentElement;
        
        // Create a new observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const leetcodeTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
                    chrome.storage.local.set({ 
                        isDarkTheme: leetcodeTheme === 'dark'
                    });
                    //console.log(`Theme changed to: ${leetcodeTheme}`);
                }
            });
        });
        
        // Start observing
        observer.observe(htmlElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    });
}

// show the leetcode difficulty if the user has enabled it in the settings
function showDifficulty() {
    // Check if we're on the description tab before proceeding
    const isDescriptionPage = !window.location.href.includes('/solutions');
    if (!isDescriptionPage) {
        return;
    }

    chrome.storage.local.get(['showDifficulty'], (result) => {
        const showDifficulty = result.showDifficulty;
        const difficultyContainer = document.querySelectorAll('div.relative.inline-flex')[0] as HTMLDivElement;
        if (!difficultyContainer) return;
        if (showDifficulty) {
            // hide the first child of the difficulty container
            difficultyContainer.style.display = 'block';
        }
        else {
            difficultyContainer.style.display = 'none';
        }
    });
}

// show the leetcode problem rating if the user has enabled it in the settings
function showRating(problemTitle: string) {
    // Check if we're on the description tab before proceeding
    const isDescriptionPage = !window.location.href.includes('/solutions');
    if (!isDescriptionPage) {
        return;
    }

    chrome.storage.local.get(['showRating'], (result) => {
        const showRating = result.showRating;
        if (!showRating) {
            const ratingElement = document.getElementById('rating');
            if (ratingElement) {
                ratingElement.remove();
            }
            return;
        }

        chrome.storage.local.get(['leetcodeProblems'], (result) => {
            const problem = result.leetcodeProblems.questions.find((problem: Problem) => problem.title === problemTitle);
            if (!problem?.rating) return;

            let ratingElement = document.getElementById('rating');
            if (!ratingElement) {
                ratingElement = document.createElement('div');
                ratingElement.id = 'rating';
            }

            ratingElement.textContent = problem.rating;
            ratingElement.style.fontSize = '11px';
            ratingElement.style.letterSpacing = '.5px';
            ratingElement.style.borderRadius = '6px';
            ratingElement.style.width = '60px';
            ratingElement.style.textAlign = 'center';
            ratingElement.style.padding = '4px 8px';
            ratingElement.style.transition = 'all 0.2s ease';

            chrome.storage.local.get(['isDarkTheme'], (result) => {
                const isDark = result.isDarkTheme;
                if (ratingElement) {
                    ratingElement.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
                    ratingElement.style.color = isDark ? '#40a9ff' : '#1a1a1a';
                    ratingElement.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                }
            });

            const difficultyContainer = document.querySelectorAll('div.relative.inline-flex')[0] as HTMLDivElement;
            if (difficultyContainer?.parentElement && ratingElement) {
                difficultyContainer.parentElement.insertBefore(ratingElement, difficultyContainer.parentElement.firstChild);
            }
        });
    });
}

// show the company tags if the user has enabled it in the settings
function showCompanyTags(problemTitle: string) {
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        if (!result.showCompanyTags) {
            return;
        }

        // Check if we're on the description tab before proceeding
        const isDescriptionPage = !window.location.href.includes('/solutions');
        if (!isDescriptionPage) {
            return;
        }

        // Try to find the description element with retries
        const maxRetries = 10;
        const baseDelay = 300;
        let retryCount = 0;

        const insertCompanyTags = (description: Element) => {
            // Double check for existing container before inserting
            if (document.getElementById('companyTagContainer')) {
                return;
            }

            // Create new container
            const newCompanyTagContainer = document.createElement('div');
            newCompanyTagContainer.id = 'companyTagContainer';
            newCompanyTagContainer.style.display = 'flex';
            newCompanyTagContainer.style.flexDirection = 'row';
            newCompanyTagContainer.style.marginBottom = '20px';
            newCompanyTagContainer.style.gap = '5px';

            description.insertBefore(newCompanyTagContainer, description.firstChild);

            // Load and inject company tags
            loadCompanyTags(problemTitle, newCompanyTagContainer);
        };

        const tryInsertCompanyTags = () => {
            // First check if container already exists to prevent duplicates
            if (document.getElementById('companyTagContainer')) {
                return;
            }

            const description = document.getElementsByClassName('elfjS')[0];
            
            if (!description && retryCount < maxRetries) {
                // Use exponential backoff for retry delay
                const delay = baseDelay * Math.pow(1.5, retryCount);
                retryCount++;
                setTimeout(tryInsertCompanyTags, delay);
                return;
            }

            if (!description) {
                
                // If still not found, set up a MutationObserver to watch for DOM changes
                const observer = new MutationObserver((mutations, obs) => {
                    // Check if container already exists
                    if (document.getElementById('companyTagContainer')) {
                        obs.disconnect();
                        return;
                    }

                    const description = document.getElementsByClassName('elfjS')[0];
                    if (description) {
                        obs.disconnect(); // Stop observing once we find the element
                        insertCompanyTags(description);
                    }
                });
                
                // Start observing the document with the configured parameters
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                return;
            }

            // If we found the description element, insert the company tags
            insertCompanyTags(description);
        };

        // Start the process
        tryInsertCompanyTags();
    });
}

// loads and creates company tags for the problem from the local storage
function loadCompanyTags(problemTitle: string, companyTagContainer: HTMLElement) {
    companyTagContainer.id = 'companyTagContainer';
    companyTagContainer.style.display = 'flex';
    companyTagContainer.style.flexDirection = 'row';
    companyTagContainer.style.marginTop = '16px';
    companyTagContainer.style.gap = '8px';
    companyTagContainer.style.flexWrap = 'wrap';

    const description = document.getElementsByClassName('elfjS')[0];
    if (!description) return;

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((p: Problem) => p.title === problemTitle);
        if (!problem?.companies?.length) return;

        const topCompanies = problem.companies.slice(0, 5);
        topCompanies.forEach((company: { name: string; }) => {
            const button = document.createElement('button');
            button.classList.add('company-tag');
            button.onclick = () => {
                chrome.runtime.sendMessage({
                    action: 'openCompanyPage', company: company.name,
                });
            };

            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.gap = '8px';
            button.style.padding = '6px 12px';
            button.style.borderRadius = '6px';
            button.style.fontSize = '11px';
            button.style.letterSpacing = '.5px';
            button.style.transition = 'all 0.2s ease';
            button.style.cursor = 'pointer';
            

            chrome.storage.local.get(['isDarkTheme'], (result) => {
                const isDark = result.isDarkTheme;
                updateCompanyTagStyle(button, isDark);
            });

            const icon = document.createElement('img');
            icon.src = `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s/g, '')}.com`;
            icon.style.width = '14px';
            icon.style.height = '14px';
            button.appendChild(icon);

            const companyName = document.createTextNode(company.name);
            button.appendChild(companyName);
            companyTagContainer.appendChild(button);
        });
    });

    description.insertBefore(companyTagContainer, description.firstChild);
    return companyTagContainer;
}

function updateCompanyTagStyle(button: HTMLElement, isDark: boolean) {
    button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
    button.style.color = isDark ? '#fff' : '#1a1a1a';
    button.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;

    // Remove existing listeners
    const oldMouseEnter = button.onmouseenter;
    const oldMouseLeave = button.onmouseleave;
    if (oldMouseEnter) button.removeEventListener('mouseenter', oldMouseEnter);
    if (oldMouseLeave) button.removeEventListener('mouseleave', oldMouseLeave);

    // Add new theme-aware listeners
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = isDark ? '#424242' : '#e6e6e6';
        button.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
        button.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    });
}

function updateThemeForCompanyTags(isDark: boolean) {
    const companyTags = document.querySelectorAll('.company-tag');
    companyTags.forEach((tag) => {
        if (tag instanceof HTMLElement) {
            updateCompanyTagStyle(tag, isDark);
        }
    });
}

function setupDescriptionThemeListener() {
    // Listen for LeetCode's theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target instanceof HTMLElement && mutation.target.tagName === 'BODY') {
                chrome.storage.local.get(['themeMode'], (result) => {
                    // Only sync theme if in auto mode
                    if (result.themeMode === 'auto') {
                        const isDark = document.body.classList.contains('dark');
                        // Update our extension's theme setting
                        chrome.storage.local.set({ isDarkTheme: isDark });
                        updateThemeForCompanyTags(isDark);
                    }
                });
            }
        });
    });

    // Start observing the body element for class changes
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });

    // Also listen for our extension's theme changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.isDarkTheme) {
            updateThemeForCompanyTags(changes.isDarkTheme.newValue);
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateDescription') {
        // For settings updates, bypass the state checks
        if (request.isSettingsUpdate) {
            console.log('Updating description tab due to settings change...');
            updatePageContent();
            return true;
        }

        // Only detect theme on first load, problem change, or refresh
        if (!request.isProblemChange && !request.isRefresh) {
            return true;
        }

        console.log('Updating description tab...');
        detectAndSyncTheme();
        showExamples();
        showCompanyTags(request.title.split('-')[0].trim());
        showDifficulty();
        showRating(request.title.split('-')[0].trim());

        // Add theme change listener after creating company tags
        setupDescriptionThemeListener();
    } else if (request.action === 'getTheme') {
        // Return the current LeetCode theme
        const htmlElement = document.documentElement;
        const leetcodeTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
        sendResponse({ theme: leetcodeTheme });
    }
    
    // Return true to indicate we will send a response asynchronously (needed for sendResponse)
    return true;
});

// Self-initialization function that runs when the content script loads
function initializeDescriptionTab() {
    // Wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
        onDOMReady();
    }

    function onDOMReady() {
        // Set up theme detection and synchronization
        setupDescriptionThemeListener();
        
        // Initial load of enhancements
        updatePageContent();
        
        // Set up URL change detection using History API
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(data: any, unused: string, url?: string | URL) {
            originalPushState.call(this, data, unused, url);
            handleUrlChange();
        };

        history.replaceState = function(data: any, unused: string, url?: string | URL) {
            originalReplaceState.call(this, data, unused, url);
            handleUrlChange();
        };

        window.addEventListener('popstate', handleUrlChange);

        // Set up a MutationObserver to detect tab and content changes
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                // Check for tab changes
                if (mutation.target instanceof HTMLElement) {
                    const isTabChange = mutation.target.getAttribute('role') === 'tab' ||
                                      mutation.target.closest('[role="tab"]');
                    if (isTabChange) {
                        shouldUpdate = true;
                    }
                }
                
                // Check for content changes in the main container
                if (mutation.type === 'childList' && 
                    ((mutation.target instanceof HTMLElement && mutation.target.classList?.contains('elfjS')) || 
                     mutation.addedNodes.length > 0)) {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate) {
                // Small delay to ensure DOM is fully updated
                setTimeout(updatePageContent, 100);
            }
        });
        
        // Observe both the tab container and the main content area
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-cy']
        });
    }
}

// Update all page content
function updatePageContent() {
    const problemTitle = document.title.replace(' - LeetCode', '').split('-')[0].trim();
    const isDescriptionTab = isOnDescriptionTab();
    
    if (isDescriptionTab) {
        showCompanyTags(problemTitle);
        showDifficulty();
        showRating(problemTitle);
        showExamples();
    }
}

// Check if we're on the description tab
function isOnDescriptionTab() {
    // Check multiple conditions to determine if we're on the description tab
    const descriptionTab = document.querySelector('[data-cy="description-tab"]');
    const isDescriptionActive = descriptionTab?.classList.contains('active');
    const notOnSolutions = !window.location.href.includes('/solutions');
    const hasDescriptionContent = !!document.getElementsByClassName('elfjS')[0];
    
    return (isDescriptionActive || notOnSolutions) && hasDescriptionContent;
}

// Handle URL changes
function handleUrlChange() {
    // Small delay to ensure DOM is updated
    setTimeout(updatePageContent, 200);
}

// Initialize the content script
initializeDescriptionTab();

