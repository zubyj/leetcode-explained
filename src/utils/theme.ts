export function initializeTheme(): void {
    // First, try to get theme from localStorage for immediate application
    const storedTheme = localStorage.getItem('leetcode-explained-theme');
    
    // Get the full settings from chrome storage
    chrome.storage.local.get(['isDarkTheme', 'themeMode'], (result) => {
        const theme = result.isDarkTheme ? 'dark' : 'light';
        
        // Always ensure the data-theme attribute is set
        document.documentElement.setAttribute('data-theme', theme);
        
        // Store in localStorage for faster access next time
        localStorage.setItem('leetcode-explained-theme', theme);
        
        // If theme is light, ensure any dark theme styles are removed
        if (theme === 'light') {
            clearInlineStyles();
        } else {
            // For dark theme, ensure dark theme styles are applied
            applyDarkThemeStyles();
        }
        
        // Update the UI to show the current theme
        updateThemeUI(theme, result.themeMode || 'manual');
        
        // If auto mode is enabled, check active tab for LeetCode's theme
        if (result.themeMode === 'auto') {
            tryDetectThemeInPopup();
        }
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
                // If we're in dark mode, switch to light mode
                newTheme = 'light';
                newMode = 'manual';
                
                // When switching to light theme, clear the inline styles
                clearInlineStyles();
            } else {
                // If we're in light mode, switch to auto mode
                newMode = 'auto';
                // When switching to auto mode, try to detect theme immediately
                tryDetectThemeInPopup();
                return; // Exit early as tryDetectThemeInPopup will handle the rest
            }
        } else {
            // If we're in auto mode, switch to dark mode
            newTheme = 'dark';
            newMode = 'manual';
            
            // When switching to dark theme, apply dark styles immediately
            applyDarkThemeStyles();
        }
        
        document.documentElement.setAttribute('data-theme', newTheme);

        // Update storage with new theme and mode
        chrome.storage.local.set({ 
            isDarkTheme: newTheme === 'dark',
            themeMode: newMode
        });
        
        // Also update localStorage for faster initial loading
        localStorage.setItem('leetcode-explained-theme', newTheme);

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
    
    // Apply the appropriate theme styles
    if (theme === 'light') {
        clearInlineStyles();
    } else {
        applyDarkThemeStyles();
    }
    
    // Save settings to chrome storage
    chrome.storage.local.set({ 
        isDarkTheme: theme === 'dark',
        themeMode: mode
    });
    
    // Also save to localStorage for faster initial loading
    localStorage.setItem('leetcode-explained-theme', theme);
    
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
        // Show that auto theme is enabled
        themeIcon.textContent = '🔄';
        themeText.textContent = 'Auto';
    } else if (theme === 'dark') {
        // Show that dark theme is enabled
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    } else {
        // Show that light theme is enabled
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    }
}

// Clear inline styles when switching to light theme
function clearInlineStyles(): void {
    // First remove the preload dark theme style if it exists
    const preloadStyle = document.getElementById('preload-dark-theme');
    if (preloadStyle) {
        preloadStyle.remove();
    }
    
    // Get all style elements added during page load
    const styles = document.querySelectorAll('style');
    
    // Find and remove any dark theme related styles
    styles.forEach(style => {
        if (style.textContent && 
            (style.textContent.includes('background-color: #202124') || 
             style.textContent.includes('#303134') ||
             style.textContent.includes('color: #e8eaed'))) {
            style.remove();
        }
    });
    
    // Remove any existing light theme override
    const existingOverride = document.getElementById('light-theme-override');
    if (existingOverride) {
        existingOverride.remove();
    }
    
    // Add a style that explicitly sets light theme colors
    const overrideStyle = document.createElement('style');
    overrideStyle.id = 'light-theme-override';
    overrideStyle.innerHTML = getLightThemeStyles();
    document.head.appendChild(overrideStyle);
    
    // Force a repaint to ensure styles are applied immediately
    document.body.style.display = 'none';
    document.body.offsetHeight; // This triggers a reflow
    document.body.style.display = '';
}

// Helper function to get light theme CSS
function getLightThemeStyles(): string {
    return `
        html, body {
            background-color: #fff !important;
            color: #000 !important;
        }
        .material-button, .tab, button, select, input {
            background-color: #f8f9fa !important;
            color: #3c4043 !important;
            border-color: #e0e0e0 !important;
        }
        a {
            color: #4285f4 !important;
        }
        #info-message {
            background-color: rgba(248, 249, 250, 0.5) !important;
            color: #000 !important;
        }
        .response-container, pre, code {
            background-color: #f8f9fa !important;
            color: #000 !important;
            border-color: #e0e0e0 !important;
        }
    `;
}

// Apply dark theme styles
function applyDarkThemeStyles(): void {
    // Remove any existing light theme override
    const existingOverride = document.getElementById('light-theme-override');
    if (existingOverride) {
        existingOverride.remove();
    }
    
    // Remove any transition-blocking styles
    const transitionBlockers = document.querySelectorAll('style');
    transitionBlockers.forEach(style => {
        if (style.textContent && style.textContent.includes('transition: none')) {
            style.remove();
        }
    });
    
    // Check if dark theme styles already exist
    const existingDarkStyle = document.getElementById('preload-dark-theme');
    if (existingDarkStyle) {
        // If it exists, update it to ensure it has all needed styles
        existingDarkStyle.innerHTML = getDarkThemeStyles();
    } else {
        // Create dark theme styles
        const darkStyle = document.createElement('style');
        darkStyle.id = 'preload-dark-theme';
        darkStyle.innerHTML = getDarkThemeStyles();
        document.head.appendChild(darkStyle);
    }
    
    // Force a repaint to ensure styles are applied immediately
    document.body.style.display = 'none';
    document.body.offsetHeight; // This triggers a reflow
    document.body.style.display = '';
}

// Helper function to get dark theme CSS
function getDarkThemeStyles(): string {
    return `
        html, body {
            background-color: #202124 !important;
            color: #e8eaed !important;
        }
        pre, code, .response-container {
            background-color: #303134 !important;
            color: #e8eaed !important;
            border-color: #5f6368 !important;
        }
        a {
            color: #8ab4f8 !important;
        }
        #info-message {
            background-color: rgba(48, 49, 52, 0.5) !important;
            color: #e8eaed !important;
        }
        .material-button, .tab, button, select {
            background-color: #303134 !important;
            color: #e8eaed !important;
            border-color: #5f6368 !important;
        }
    `;
}