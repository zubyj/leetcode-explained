// Core theme management for the extension
// Handles theme detection, application, and storage

// Theme types
type ThemeMode = 'auto' | 'manual';
type ThemeName = 'dark' | 'light';

// Theme styles for injection
const THEME_STYLES = {
    dark: `
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
        .material-button, button, select {
            background-color: #303134 !important;
            color: #e8eaed !important;
            border-color: #5f6368 !important;
            font-weight: 550 !important;
        }
        .select {
            font-weight: 550 !important;
        }
    `,
    light: `
        html, body {
            background-color: #fff !important;
            color: #000 !important;
        }
        .material-button, button, select, input {
            background-color: #f8f9fa !important;
            color: #3c4043 !important;
            border-color: #e0e0e0 !important;
            font-weight: 550 !important;
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
        .select {
            font-weight: 550 !important;
        }
    `
};

// Initialize theme on load
export function initializeTheme(): void {
    console.log('Initializing theme...');
    
    // Get saved theme settings
    chrome.storage.local.get(['isDarkTheme', 'themeMode', 'lastDetectedTheme'], (result) => {
        let theme: ThemeName = result.isDarkTheme ? 'dark' : 'light';
        const mode: ThemeMode = result.themeMode === 'auto' ? 'auto' : 'manual';
        
        console.log(`Theme settings: Theme=${theme}, Mode=${mode}`);
        
        // For auto mode, use last detected theme if available
        if (mode === 'auto' && result.lastDetectedTheme) {
            theme = result.lastDetectedTheme;
        }
        
        // Apply the theme
        applyTheme(theme, mode);
        
        // If in auto mode, try to detect the theme from LeetCode
        if (mode === 'auto') {
            detectThemeFromPage();
        }
    });
}

// Set theme based on dropdown selection
export function setTheme(theme: ThemeName | 'auto'): void {
    console.log(`Setting theme to: ${theme}`);
    
    if (theme === 'auto') {
        // Enable auto mode but keep current theme until detection
        chrome.storage.local.get(['isDarkTheme'], (result) => {
            const currentTheme = result.isDarkTheme ? 'dark' : 'light';
            
            // Set auto mode and trigger detection
            chrome.storage.local.set({ themeMode: 'auto' }, () => {
                applyTheme(currentTheme, 'auto');
                detectThemeFromPage();
            });
        });
    } else {
        // Set manual theme
        applyTheme(theme, 'manual');
    }
}

// Apply a theme to the current page
function applyTheme(theme: ThemeName, mode: ThemeMode): void {
    console.log(`Applying theme: ${theme}, mode: ${mode}`);
    
    // Set data attribute for CSS variables
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme styles
    applyThemeStyles(theme);
    
    // Save to storage
    chrome.storage.local.set({ 
        isDarkTheme: theme === 'dark',
        themeMode: mode,
        lastDetectedTheme: theme 
    });
    
    // Save to localStorage for faster initial loading
    localStorage.setItem('leetcode-explained-theme', theme);
    
    // Update any UI selectors
    updateThemeUI(theme, mode);
}

// Apply inline theme styles
function applyThemeStyles(theme: ThemeName): void {
    // Remove any existing theme styles
    const existingDark = document.getElementById('preload-dark-theme');
    const existingLight = document.getElementById('light-theme-override');
    
    if (existingDark) existingDark.remove();
    if (existingLight) existingLight.remove();
    
    // Create new style element
    const style = document.createElement('style');
    style.id = theme === 'dark' ? 'preload-dark-theme' : 'light-theme-override';
    style.innerHTML = THEME_STYLES[theme];
    document.head.appendChild(style);
    
    // Force a repaint to ensure styles are applied immediately
    document.body.style.display = 'none';
    document.body.offsetHeight; // This triggers a reflow
    document.body.style.display = '';
}

// Update the UI to show current theme
function updateThemeUI(theme: ThemeName, mode: ThemeMode): void {
    // Update theme select dropdown if it exists
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    if (themeSelect) {
        themeSelect.value = mode === 'auto' ? 'auto' : theme;
    }
    
    // Legacy theme toggle button (for backward compatibility)
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (themeIcon && themeText) {
        if (mode === 'auto') {
            themeIcon.textContent = '🔄';
            themeText.textContent = 'Auto';
        } else if (theme === 'dark') {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark';
        } else {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
        }
    }
}

// Detect theme from active LeetCode page
function detectThemeFromPage(): void {
    console.log('Detecting theme from active tab...');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'getTheme' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Error detecting theme:', chrome.runtime.lastError);
                        return;
                    }
                    
                    if (response?.theme) {
                        console.log('Detected theme:', response.theme);
                        
                        // Apply the detected theme
                        applyTheme(response.theme, 'auto');
                    }
                }
            );
        }
    });
}