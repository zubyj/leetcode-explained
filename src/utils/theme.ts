export function initializeTheme(): void {
    console.log('Initializing theme...');
    
    // First, try to get theme from localStorage for immediate application
    const storedTheme = localStorage.getItem('leetcode-explained-theme');
    console.log('Theme from localStorage:', storedTheme);
    
    // Get the full settings from chrome storage
    chrome.storage.local.get(['isDarkTheme', 'themeMode', 'lastDetectedTheme'], (result) => {
        let theme = result.isDarkTheme ? 'dark' : 'light';
        const mode = result.themeMode || 'manual';
        
        console.log(`Theme from storage: Theme=${theme}, Mode=${mode}, LastDetected=${result.lastDetectedTheme}`);
        
        // For auto mode, try to use lastDetectedTheme if available
        if (mode === 'auto' && result.lastDetectedTheme) {
            theme = result.lastDetectedTheme;
            console.log(`Using last detected theme: ${theme}`);
        }
        
        // Always ensure the data-theme attribute is set
        document.documentElement.setAttribute('data-theme', theme);
        
        // Store in localStorage for faster access next time
        localStorage.setItem('leetcode-explained-theme', theme);
        
        // Apply appropriate theme styles
        if (theme === 'light') {
            // Clear inline dark theme styles
            const darkThemeStyle = document.getElementById('preload-dark-theme');
            if (darkThemeStyle) darkThemeStyle.remove();
            
            // Add a light theme override style
            const lightStyle = document.getElementById('light-theme-override') || document.createElement('style');
            lightStyle.id = 'light-theme-override';
            lightStyle.innerHTML = `
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
            document.head.appendChild(lightStyle);
        } else {
            // Remove light theme override if exists
            const lightStyle = document.getElementById('light-theme-override');
            if (lightStyle) lightStyle.remove();
            
            // Add dark theme styles
            const darkStyle = document.getElementById('preload-dark-theme') || document.createElement('style');
            darkStyle.id = 'preload-dark-theme';
            darkStyle.innerHTML = `
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
                .material-button, .tab, button, select {
                    background-color: #303134 !important;
                    color: #e8eaed !important;
                    border-color: #5f6368 !important;
                }
            `;
            document.head.appendChild(darkStyle);
        }
        
        // Force a repaint to ensure styles are applied immediately
        document.body.style.display = 'none';
        document.body.offsetHeight; // This triggers a reflow
        document.body.style.display = '';
        
        // Update any theme dropdowns
        const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
        if (themeSelect) {
            if (mode === 'auto') {
                themeSelect.value = 'auto';
            } else {
                themeSelect.value = theme;
            }
        }
        
        // If auto mode is enabled, check active tab for LeetCode's theme
        if (mode === 'auto') {
            tryDetectThemeInPopup();
        }
    });
}

export function toggleTheme(): void {
    chrome.storage.local.get(['isDarkTheme', 'themeMode'], (result) => {
        const currentTheme = result.isDarkTheme ? 'dark' : 'light';
        const currentMode = result.themeMode || 'manual';
        
        console.log(`Toggle theme called. Current: ${currentTheme}, Mode: ${currentMode}`);
        
        // Implement the cycling logic: dark -> light -> auto -> dark
        if (currentMode === 'manual' && currentTheme === 'dark') {
            // Dark -> Light
            console.log('Switching from dark to light mode');
            document.documentElement.setAttribute('data-theme', 'light');
            clearInlineStyles();
            
            chrome.storage.local.set({ 
                isDarkTheme: false,
                themeMode: 'manual'
            }, () => {
                localStorage.setItem('leetcode-explained-theme', 'light');
                updateThemeUI('light', 'manual');
            });
            
        } else if (currentMode === 'manual' && currentTheme === 'light') {
            // Light -> Auto
            console.log('Switching from light to auto mode');
            
            // First set mode to auto so other components know we're in auto mode
            chrome.storage.local.set({ 
                themeMode: 'auto'
            }, () => {
                // Then detect the theme based on LeetCode
                console.log('Auto mode enabled, detecting theme...');
                tryDetectThemeInPopup();
            });
            
        } else {
            // Auto -> Dark
            console.log('Switching from auto to dark mode');
            document.documentElement.setAttribute('data-theme', 'dark');
            applyDarkThemeStyles();
            
            chrome.storage.local.set({ 
                isDarkTheme: true,
                themeMode: 'manual'
            }, () => {
                localStorage.setItem('leetcode-explained-theme', 'dark');
                updateThemeUI('dark', 'manual');
            });
        }
    });
}

// Try to detect theme in popup or settings page by sending a message to the active tab
function tryDetectThemeInPopup(): void {
    console.log('Attempting to detect theme from active tab...');
    
    // Send a message to the active tab to get the LeetCode theme
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            console.log('Sending getTheme message to tab:', tabs[0].url);
            
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'getTheme' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Error detecting theme:', chrome.runtime.lastError);
                        applyTheme('dark', 'auto');
                        return;
                    }
                    
                    if (response && response.theme) {
                        console.log('Successfully detected theme from page:', response.theme);
                        
                        // Force apply the detected theme
                        const detectedTheme = response.theme;
                        
                        // Update storage first to ensure consistency
                        chrome.storage.local.set({
                            isDarkTheme: detectedTheme === 'dark',
                            themeMode: 'auto',
                            lastDetectedTheme: detectedTheme
                        }, () => {
                            // Then update UI and styles
                            document.documentElement.setAttribute('data-theme', detectedTheme);
                            
                            if (detectedTheme === 'light') {
                                clearInlineStyles();
                            } else {
                                applyDarkThemeStyles();
                            }
                            
                            // Update localStorage for faster access
                            localStorage.setItem('leetcode-explained-theme', detectedTheme);
                            
                            // Finally update UI
                            updateThemeUI(detectedTheme, 'auto');
                        });
                    } else {
                        console.log('No theme detected, defaulting to dark');
                        applyTheme('dark', 'auto');
                    }
                }
            );
        } else {
            console.log('No active tab, defaulting to dark');
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
        themeMode: mode,
        lastDetectedTheme: theme // Store last detected theme
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