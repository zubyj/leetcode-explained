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
                // Theme will be determined by LeetCode in content script
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
    const modeIndicator = document.getElementById('theme-mode-indicator');
    
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
    
    // Update mode indicator if it exists
    if (modeIndicator) {
        modeIndicator.textContent = mode === 'auto' ? 'Auto' : 'Manual';
        modeIndicator.style.color = mode === 'auto' ? '#4caf50' : '#ff9800';
    }
}