/*
    Manages the settings page which is opened when the user clicks on the settings icon in the popup
    The user can toggle the following settings:
        - Show examples
        - Show difficulty
        - The user can also change the font size of the description
    The Leetcode problem's descriptions tab will be updated with the new settings
*/

import { initializeTheme, toggleTheme } from "../utils/theme.js";

const homeButton = document.getElementById('open-home-btn') as HTMLButtonElement;
homeButton.onclick = () => {
    window.location.href = 'popup.html';
};

document.addEventListener('DOMContentLoaded', () => {

    initializeTheme();
    
    // Check active tab for theme if in auto mode
    chrome.storage.local.get(['themeMode'], (result) => {
        if (result.themeMode === 'auto') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id && tabs[0].url && tabs[0].url.includes('leetcode.com/problems')) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { action: 'getTheme' },
                        (response) => {
                            if (!chrome.runtime.lastError && response && response.theme) {
                                // Apply detected theme
                                document.documentElement.setAttribute('data-theme', response.theme);
                                chrome.storage.local.set({ 
                                    isDarkTheme: response.theme === 'dark'
                                });
                                // Update UI
                                const themeIcon = document.getElementById('theme-icon');
                                const themeText = document.getElementById('theme-text');
                                if (themeIcon && themeText) {
                                    themeIcon.textContent = '🔄';
                                    themeText.textContent = 'Auto Theme';
                                }
                            }
                        }
                    );
                }
            });
        }
    });
    
    document.getElementById('enable-dark-theme-btn')?.addEventListener('click', () => {
        toggleTheme();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
            chrome.tabs.sendMessage(tabs[0].id || 0, { action: 'updateSolutions', title: tabs[0].title || 'title' });
        });
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
        
        switch (fontSize) {
            case '12':
                scaleFactor = 0.9;
                break;
            case '16':
                scaleFactor = 1.1;
                break;
            default: // 14px is the default
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