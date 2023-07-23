/*
    Manages the settings page which is opened when the user clicks on the settings icon in the popup
    The user can toggle the following settings:
        - Show company tags
        - Show examples
        - Show difficulty
        - The user can also change the font size of the description
    The Leetcode problem's descriptions tab will be updated with the new settings
*/

var { browser } = require('webextension-polyfill-ts');

const homeButton = document.getElementById('home-button') as HTMLButtonElement;
homeButton.onclick = () => {
    window.location.href = 'popup.html';
};

document.addEventListener('DOMContentLoaded', () => {
    browser.storage.local.get(['showCompanyTags'], (result) => {
        const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
        if (showCompanyTagsIcon) showCompanyTagsIcon.textContent = result.showCompanyTags ? '✅' : '❌';
    });
    browser.storage.local.get(['showExamples'], (result) => {
        const showExamplesIcon = document.getElementById('show-examples-icon');
        if (showExamplesIcon) showExamplesIcon.textContent = result.showExamples ? '✅' : '❌';
    });
    browser.storage.local.get(['showDifficulty'], (result) => {
        const showDifficultyIcon = document.getElementById('show-difficulty-icon');
        if (showDifficultyIcon) showDifficultyIcon.textContent = result.showDifficulty ? '✅' : '❌';
    });
});

// Get font fize and check if it is already set in local storage
const fontSizeSelect = document.getElementById('font-size-select') as HTMLSelectElement;
browser.storage.local.get('fontSize', function (data) {
    if (data.fontSize) {
        fontSizeSelect.value = data.fontSize;
        document.documentElement.style.setProperty('--dynamic-font-size', `${data.fontSize}px`);
    }
});
fontSizeSelect.onchange = function (event: Event) {
    const selectedFontSize = (event.target as HTMLInputElement).value;
    browser.storage.local.set({ fontSize: selectedFontSize });
    document.documentElement.style.setProperty('--dynamic-font-size', `${selectedFontSize}px`);
};

const showCompanyTagsBtn = document.getElementById('show-company-tags-btn');
showCompanyTagsBtn && showCompanyTagsBtn.addEventListener('click', function () {
    browser.storage.local.get(['showCompanyTags'], (result) => {
        const showCompanyTags = !result.showCompanyTags;
        browser.storage.local.set({ showCompanyTags: showCompanyTags }, () => {
            const showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
            showCompanyTagsIcon && (showCompanyTagsIcon.textContent = showCompanyTags ? '✅' : '❌');
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                browser.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
            });
        });
    });
});

let showExamplesBtn = document.getElementById('show-examples-btn');
showExamplesBtn && showExamplesBtn.addEventListener('click', function () {
    browser.storage.local.get(['showExamples'], (result) => {
        const showExamples = !result.showExamples;
        browser.storage.local.set({ showExamples: showExamples }, () => {
            const showExamplesIcon = document.getElementById('show-examples-icon');
            showExamplesIcon && (showExamplesIcon.textContent = showExamples ? '✅' : '❌');
        });
        // Manually trigger the update description after toggling
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            browser.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
        });
    });
});

const showDifficultyBtn = document.getElementById('show-difficulty-btn');
showDifficultyBtn && showDifficultyBtn.addEventListener('click', function () {
    browser.storage.local.get(['showDifficulty'], (result) => {
        const showDifficulty = !result.showDifficulty;
        browser.storage.local.set({ showDifficulty: showDifficulty }, () => {
            const showDifficultyIcon = document.getElementById('show-difficulty-icon');
            if (showDifficultyIcon) showDifficultyIcon.textContent = showDifficulty ? '✅' : '❌';
        });
        // Manually trigger the update description after toggling
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            browser.tabs.sendMessage(tabs[0].id || 0, { action: 'updateDescription', title: tabs[0].title || 'title' });
        });
    });
});

