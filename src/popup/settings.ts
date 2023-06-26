document.getElementById('home-button')!.onclick = () => {
    window.location.href = 'popup.html';
};

document.addEventListener('DOMContentLoaded', (event) => {
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        let showCompanyTagsIcon = document.getElementById('show-company-tags-icon');
        showCompanyTagsIcon!.textContent = result.showCompanyTags ? '✅' : '❌';
    });
    chrome.storage.local.get(['showExamples'], (result) => {
        let showExamplesIcon = document.getElementById('show-examples-icon');
        showExamplesIcon!.textContent = result.showExamples ? '✅' : '❌';
    });
});

// Get font fize and check if it is already set in local storage
let fontSizeSelect = document.getElementById('font-size-select');
chrome.storage.local.get('fontSize', function (data) {
    if (data.fontSize) {
        fontSizeSelect!.value = data.fontSize;
        document.documentElement.style.setProperty('--dynamic-font-size', `${data.fontSize}px`);
    }
});

fontSizeSelect!.onchange = function () {
    let selectedFontSize = this.value;
    chrome.storage.local.set({ fontSize: selectedFontSize });
    // Add this line to set the font size in your CSS variables every time the font size is changed
    document.documentElement.style.setProperty('--dynamic-font-size', `${selectedFontSize}px`);
};

document.getElementById('show-company-tags-btn')!.addEventListener('click', function () {
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        const showCompanyTags = !result.showCompanyTags;
        chrome.storage.local.set({ showCompanyTags: showCompanyTags }, () => {
            document.getElementById('show-company-tags-icon')!.textContent = showCompanyTags ? '✅' : '❌';
            // Manually trigger the update description after toggling
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id!, { action: 'updateDescription', title: tabs[0].title || 'title' });
            });
        });
    });
});

document.getElementById('show-examples-btn')!.addEventListener('click', function () {
    chrome.storage.local.get(['showExamples'], (result) => {
        const showExamples = !result.showExamples;
        chrome.storage.local.set({ showExamples: showExamples }, () => {
            document.getElementById('show-examples-icon')!.textContent = showExamples ? '✅' : '❌';
        })
        // Manually trigger the update description after toggling
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id!, { action: 'updateDescription', title: tabs[0].title || 'title' });
        });
    });
});

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}