/*
    Manages the settings page which is opened when the user clicks on the settings icon in the popup
    The user can toggle the following settings:
        - Show examples
        - Show difficulty
        - The user can also change the font size of the description
    The Leetcode problem's descriptions tab will be updated with the new settings
*/

import { initializeTheme, setTheme } from "../utils/theme.js";

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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme settings
    initializeTheme();
    
    // Set up theme dropdown
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    if (themeSelect) {
        // Set up change listener
        themeSelect.addEventListener('change', () => {
            const selectedValue = themeSelect.value as 'dark' | 'light' | 'auto';
            
            // Apply the selected theme
            setTheme(selectedValue);
            
            // Update LeetCode problem if active - only update solutions tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSolutions', title: tabs[0].title || 'title' });
                }
            });
        });
    }
    
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

    // Initialize settings toggles
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

    // Helper function to send messages safely to content script
    function safelySendMessage(message: any) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tabId = tabs[0]?.id;
            if (!tabs || !tabs[0] || typeof tabId === 'undefined') {
                return;
            }
            
            try {
                // Send message to background script for settings updates
                if (message.action === 'updateDescription') {
                    chrome.runtime.sendMessage({ action: 'settingsUpdate' });
                    return;
                }

                // For other messages, send directly to content script
                chrome.tabs.sendMessage(tabId, message, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message:', chrome.runtime.lastError.message);
                        // Attempt to inject the content script if it's not already injected
                        chrome.scripting.executeScript({
                            target: { tabId },
                            files: ['dist/content-script/update-description-tab.js']
                        }).then(() => {
                            // Try sending the message again after injecting the script
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tabId, message);
                            }, 100);
                        }).catch(err => {
                            console.error('Error injecting content script:', err);
                        });
                    }
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });
    }

    // Set up toggle event handlers
    const showCompanyTagsBtn = document.getElementById('show-company-tags-btn');
    showCompanyTagsBtn && showCompanyTagsBtn.addEventListener('click', function () {
        chrome.storage.local.get(['showCompanyTags'], (result) => {
            const showCompanyTags = !result.showCompanyTags;
            chrome.storage.local.set({ showCompanyTags: showCompanyTags }, () => {
                const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
                showCompanyTagsIcon && (showCompanyTagsIcon.textContent = showCompanyTags ? '✅' : '❌');
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
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
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
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
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
            });
        });
    });
});