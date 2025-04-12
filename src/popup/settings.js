/*
    Handles settings page functionality with proper message passing
*/

document.addEventListener('DOMContentLoaded', () => {
    // Home button navigation
    const homeButton = document.getElementById('open-home-btn');
    homeButton.onclick = () => {
        window.location.href = 'popup.html';
    };

    // Theme toggle handlers
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');

    // Initialize settings icons
    chrome.storage.local.get(['showCompanyTags', 'showExamples', 'showDifficulty', 'showRating'], (result) => {
        const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
        const showExamplesIcon = document.getElementById('show-examples-icon');
        const showDifficultyIcon = document.getElementById('show-difficulty-icon');
        const showRatingIcon = document.getElementById('show-rating-icon');

        if (showCompanyTagsIcon) showCompanyTagsIcon.textContent = result.showCompanyTags ? '✅' : '❌';
        if (showExamplesIcon) showExamplesIcon.textContent = result.showExamples ? '✅' : '❌';
        if (showDifficultyIcon) showDifficultyIcon.textContent = result.showDifficulty ? '✅' : '❌';
        if (showRatingIcon) showRatingIcon.textContent = result.showRating ? '✅' : '❌';
    });

    // Helper function to send messages safely to content script
    function safelySendMessage(message) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs || !tabs[0] || !tabs[0].id) {
                return;
            }
            
            try {
                chrome.tabs.sendMessage(tabs[0].id, message, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message:', chrome.runtime.lastError.message);
                        // Attempt to inject the content script if it's not already injected
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            files: ['dist/content-script/update-description-tab.js']
                        }).then(() => {
                            // Try sending the message again after injecting the script
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tabs[0].id, message);
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
    showCompanyTagsBtn && showCompanyTagsBtn.addEventListener('click', function() {
        chrome.storage.local.get(['showCompanyTags'], (result) => {
            const showCompanyTags = !result.showCompanyTags;
            chrome.storage.local.set({ showCompanyTags: showCompanyTags }, () => {
                const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
                if (showCompanyTagsIcon) showCompanyTagsIcon.textContent = showCompanyTags ? '✅' : '❌';
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
            });
        });
    });

    const showExamplesBtn = document.getElementById('show-examples-btn');
    showExamplesBtn && showExamplesBtn.addEventListener('click', function() {
        chrome.storage.local.get(['showExamples'], (result) => {
            const showExamples = !result.showExamples;
            chrome.storage.local.set({ showExamples: showExamples }, () => {
                const showExamplesIcon = document.getElementById('show-examples-icon');
                if (showExamplesIcon) showExamplesIcon.textContent = showExamples ? '✅' : '❌';
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
            });
        });
    });

    const showDifficultyBtn = document.getElementById('show-difficulty-btn');
    showDifficultyBtn && showDifficultyBtn.addEventListener('click', function() {
        chrome.storage.local.get(['showDifficulty'], (result) => {
            const showDifficulty = !result.showDifficulty;
            chrome.storage.local.set({ showDifficulty: showDifficulty }, () => {
                const showDifficultyIcon = document.getElementById('show-difficulty-icon');
                if (showDifficultyIcon) showDifficultyIcon.textContent = showDifficulty ? '✅' : '❌';
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
            });
        });
    });

    const showRatingBtn = document.getElementById('show-rating-btn');
    showRatingBtn && showRatingBtn.addEventListener('click', function() {
        chrome.storage.local.get(['showRating'], (result) => {
            const showRating = !result.showRating;
            chrome.storage.local.set({ showRating: showRating }, () => {
                const showRatingIcon = document.getElementById('show-rating-icon');
                if (showRatingIcon) showRatingIcon.textContent = showRating ? '✅' : '❌';
                safelySendMessage({ action: 'updateDescription', title: document.title || 'title' });
            });
        });
    });

    // Font size handler (simplified for this fix)
    fontSizeSelect && fontSizeSelect.addEventListener('change', function() {
        const fontSize = this.value;
        chrome.storage.local.set({ fontSize: parseInt(fontSize) });
    });
}); 