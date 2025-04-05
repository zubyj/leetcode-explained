export function initializeTheme(): void {
    chrome.storage.local.get(['isDarkTheme', 'themeMode'], (result) => {
        const theme = result.isDarkTheme ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeUI(theme, result.themeMode || 'manual'); // Pass theme mode to update UI
    });
}

export function toggleTheme(): void {
    chrome.storage.local.get(['isDarkTheme', 'themeMode'], (result) => {
        const currentTheme = result.isDarkTheme ? 'dark' : 'light';
        const currentMode = result.themeMode || 'manual';
        
        // Cycle through: dark -> light -> auto -> dark
        let newTheme = currentTheme;
        let newMode = currentMode;
        
        if (currentMode === 'manual') {
            if (currentTheme === 'dark') {
                // Dark -> Light
                newTheme = 'light';
                newMode = 'manual';
            } else {
                // Light -> Auto
                newMode = 'auto';
                // When switching to auto mode, try to detect theme immediately
                tryDetectThemeInPopup();
                return; // Exit early as tryDetectThemeInPopup will handle the rest
            }
        } else {
            // Auto -> Dark
            newTheme = 'dark';
            newMode = 'manual';
        }
        
        document.documentElement.setAttribute('data-theme', newTheme);

        // Update storage with new theme and mode
        chrome.storage.local.set({ 
            isDarkTheme: newTheme === 'dark',
            themeMode: newMode
        });

        updateThemeUI(newTheme, newMode);
    });
}

// Try to detect theme in popup or settings page by sending a message to the active tab
function tryDetectThemeInPopup(): void {
    // Send a message to the active tab to get the LeetCode theme
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'getTheme' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        // If there's an error (e.g., no content script running), default to dark
                        applyTheme('dark', 'auto');
                    } else if (response && response.theme) {
                        // If we received a theme from the content script, use it
                        applyTheme(response.theme, 'auto');
                    } else {
                        // Default to dark if we can't detect
                        applyTheme('dark', 'auto');
                    }
                }
            );
        } else {
            // No active tab, default to dark
            applyTheme('dark', 'auto');
        }
    });
}

// Apply the detected theme to the current page
function applyTheme(theme: string, mode: string): void {
    // Update UI
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save settings
    chrome.storage.local.set({ 
        isDarkTheme: theme === 'dark',
        themeMode: mode
    });
    
    // Update UI elements
    updateThemeUI(theme, mode);
}

// This function is no longer needed as toggleTheme now handles mode switching
export function toggleThemeMode(): void {
    chrome.storage.local.get(['themeMode'], (result) => {
        const currentMode = result.themeMode || 'manual';
        const newMode = currentMode === 'auto' ? 'manual' : 'auto';
        
        chrome.storage.local.set({ themeMode: newMode });
        
        // If switching to auto mode, immediately detect the theme
        if (newMode === 'auto') {
            // For popup or options page, we can't detect LeetCode's theme
            // so we don't change isDarkTheme here
            updateThemeUI(document.documentElement.getAttribute('data-theme') || 'dark', newMode);
        } else {
            // For manual mode, just update the UI
            updateThemeUI(document.documentElement.getAttribute('data-theme') || 'dark', newMode);
        }
    });
}

function updateThemeUI(theme: string, mode: string = 'manual') {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (!themeIcon || !themeText) return;
    
    if (mode === 'auto') {
        themeIcon.textContent = '🔄';
        themeText.textContent = 'Auto Theme';
    } else if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}