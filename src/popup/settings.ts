/*
    Manages the settings page which is opened when the user clicks on the settings icon in the popup
    The user can toggle the following settings:
        - Show examples
        - Show difficulty
        - The user can also change the font size of the description
    The Leetcode problem's descriptions tab will be updated with the new settings
*/

import { initializeTheme } from "../utils/theme.js";

const homeButton = document.getElementById('open-home-btn') as HTMLButtonElement;
homeButton.onclick = () => {
    // Preserve theme settings when navigating between pages
    chrome.storage.local.get(['isDarkTheme', 'themeMode'], (result) => {
        // Save current theme state to localStorage to ensure it persists
        if (result.isDarkTheme !== undefined) {
            localStorage.setItem('leetcode-explained-theme', result.isDarkTheme ? 'dark' : 'light');
        }
        // Navigate to home page
        window.location.href = 'popup.html';
    });
};

function setTheme(theme: string, mode: string) {
    console.log(`Setting theme to: ${theme}, mode: ${mode}`);
    
    // Update the DOM first for immediate feedback
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply appropriate theme styles
    if (theme === 'light') {
        // Clear dark theme inline styles
        const preloadStyle = document.getElementById('preload-dark-theme');
        if (preloadStyle) preloadStyle.remove();
        
        // Add a light theme override style
        const lightStyle = document.createElement('style');
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
        // Remove any light theme override
        const lightStyle = document.getElementById('light-theme-override');
        if (lightStyle) lightStyle.remove();
        
        // Add dark theme styles if needed
        if (!document.getElementById('preload-dark-theme')) {
            const style = document.createElement('style');
            style.id = 'preload-dark-theme';
            style.innerHTML = `
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
            document.head.appendChild(style);
        }
    }
    
    // Force a repaint to ensure styles are applied immediately
    document.body.style.display = 'none';
    document.body.offsetHeight; // This triggers a reflow
    document.body.style.display = '';
    
    // Then update storage
    chrome.storage.local.set({
        isDarkTheme: theme === 'dark',
        themeMode: mode
    }, () => {
        console.log(`Theme settings saved: Theme=${theme}, Mode=${mode}`);
        
        // Update localStorage for faster initial loading
        localStorage.setItem('leetcode-explained-theme', theme);
        
        // If auto mode is selected, try to detect theme from LeetCode
        if (mode === 'auto') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    console.log('Detecting theme from active tab:', tabs[0].url);
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { action: 'getTheme' },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.log('Error detecting theme:', chrome.runtime.lastError);
                                return;
                            }
                            
                            if (response && response.theme) {
                                console.log('Auto-detected theme:', response.theme);
                                
                                // Only apply if different from current
                                if (response.theme !== theme) {
                                    // Apply detected theme
                                    setTheme(response.theme, 'auto');
                                }
                            }
                        }
                    );
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {

    initializeTheme();
    
    // Set up theme dropdown
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    if (themeSelect) {
        // Initialize dropdown to current theme settings
        chrome.storage.local.get(['isDarkTheme', 'themeMode'], (result) => {
            const currentTheme = result.isDarkTheme ? 'dark' : 'light';
            const currentMode = result.themeMode || 'manual';
            
            console.log(`Initializing theme dropdown: Theme=${currentTheme}, Mode=${currentMode}`);
            
            if (currentMode === 'auto') {
                themeSelect.value = 'auto';
            } else {
                themeSelect.value = currentTheme;
            }
            
            // Set up change listener
            themeSelect.addEventListener('change', () => {
                const selectedValue = themeSelect.value;
                console.log('Theme dropdown changed to:', selectedValue);
                
                if (selectedValue === 'auto') {
                    // Auto mode
                    setTheme(currentTheme, 'auto'); // Keep current theme but set to auto mode
                } else {
                    // Manual mode (dark or light)
                    setTheme(selectedValue, 'manual');
                }
                
                // Update LeetCode problem if active
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateDescription', title: tabs[0].title || 'title' });
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSolutions', title: tabs[0].title || 'title' });
                    }
                });
            });
        });
    }
    
    // Check active tab for theme if in auto mode
    chrome.storage.local.get(['themeMode'], (result) => {
        if (result.themeMode === 'auto') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    console.log('Detecting theme from active tab:', tabs[0].url);
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { action: 'getTheme' },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.log('Error detecting theme:', chrome.runtime.lastError);
                                return;
                            }
                            
                            if (response && response.theme) {
                                console.log('Auto-detected theme:', response.theme);
                                // Apply detected theme
                                document.documentElement.setAttribute('data-theme', response.theme);
                                chrome.storage.local.set({ 
                                    isDarkTheme: response.theme === 'dark',
                                    lastDetectedTheme: response.theme
                                });
                            }
                        }
                    );
                }
            });
        }
    });
    
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
        if (showCompanyTagsIcon) showCompanyTagsIcon.textContent = result.showCompanyTags ? '✅' : '❌';
    });
    chrome.storage.local.get(['showExamples'], (result) => {
        const showExamplesIcon = document.getElementById('show-examples-icon');
        if (showExamplesIcon) showExamplesIcon.textContent = result.showExamples ? '✅' : '❌';
    });
    chrome.storage.local.get(['showDifficulty'], (result) => {
        const showDifficultyIcon = document.getElementById('show-difficulty-icon');
        if (showDifficultyIcon) showDifficultyIcon.textContent = result.showDifficulty ? '✅' : '❌';
    });
    chrome.storage.local.get(['showRating'], (result) => {
        const showRatingIcon = document.getElementById('show-rating-icon');
        if (showRatingIcon) showRatingIcon.textContent = result.showRating ? '✅' : '❌';
    });

    // Get font size and set the scale factor
    const fontSizeSelect = document.getElementById('font-size-select') as HTMLSelectElement;
    chrome.storage.local.get('fontSize', function (data) {
        if (data.fontSize) {
            fontSizeSelect.value = data.fontSize.toString();
            updateScaleFactor(data.fontSize.toString());
        } else {
            // Default to small if not set
            fontSizeSelect.value = '12';
            updateScaleFactor('12');
            chrome.storage.local.set({ fontSize: 12 });
        }
    });
    
    fontSizeSelect.onchange = function (event: Event) {
        const selectedFontSize = (event.target as HTMLInputElement).value;
        chrome.storage.local.set({ fontSize: parseInt(selectedFontSize) });
        updateScaleFactor(selectedFontSize);
    };

    // Function to update scale factor based on font size
    function updateScaleFactor(fontSize: string) {
        let scaleFactor: number;
        const body = document.body;
        
        // Remove all display size classes
        body.classList.remove('small-display', 'medium-display', 'large-display');
        
        switch (fontSize) {
            case '12': // Small
                scaleFactor = 0.85;
                body.classList.add('small-display');
                break;
            case '14': // Medium
                scaleFactor = 1.1;
                body.classList.add('medium-display');
                break;
            case '16': // Large
                scaleFactor = 1.3;
                body.classList.add('large-display');
                break;
            default:
                scaleFactor = 1.0;
                break;
        }
        
        document.documentElement.style.setProperty('--scale-factor', scaleFactor.toString());
    }

    const showCompanyTagsBtn = document.getElementById('show-company-tags-btn');
    showCompanyTagsBtn && showCompanyTagsBtn.addEventListener('click', function () {
        chrome.storage.local.get(['showCompanyTags'], (result) => {
            const showCompanyTags = !result.showCompanyTags;
            chrome.storage.local.set({ showCompanyTags: showCompanyTags }, () => {
                const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
                showCompanyTagsIcon && (showCompanyTagsIcon.textContent = showCompanyTags ? '✅' : '❌');
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
                });
            });
        });
    });

    let showExamplesBtn = document.getElementById('show-examples-btn');
    showExamplesBtn && showExamplesBtn.addEventListener('click', function () {
        chrome.storage.local.get(['showExamples'], (result) => {
            const showExamples = !result.showExamples;
            chrome.storage.local.set({ showExamples: showExamples }, () => {
                const showExamplesIcon = document.getElementById('show-examples-icon');
                showExamplesIcon && (showExamplesIcon.textContent = showExamples ? '✅' : '❌');
            });
            // Manually trigger the update description after toggling
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
            });
        });
    });

    const showDifficultyBtn = document.getElementById('show-difficulty-btn');
    showDifficultyBtn && showDifficultyBtn.addEventListener('click', function () {
        chrome.storage.local.get(['showDifficulty'], (result) => {
            const showDifficulty = !result.showDifficulty;
            chrome.storage.local.set({ showDifficulty: showDifficulty }, () => {
                const showDifficultyIcon = document.getElementById('show-difficulty-icon');
                if (showDifficultyIcon) showDifficultyIcon.textContent = showDifficulty ? '✅' : '❌';
            });
            // Manually trigger the update description after toggling
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
            });
        });
    });

    const showRatingBtn = document.getElementById('show-rating-btn');
    showRatingBtn && showRatingBtn.addEventListener('click', function () {
        chrome.storage.local.get(['showRating'], (result) => {
            const showRating = !result.showRating;
            chrome.storage.local.set({ showRating: showRating }, () => {
                const showRatingIcon = document.getElementById('show-rating-icon');
                if (showRatingIcon) showRatingIcon.textContent = showRating ? '✅' : '❌';
            });
            // Manually trigger the update description after toggling
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
            });
        });
    });
});