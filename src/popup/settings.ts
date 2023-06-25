document.getElementById('home-button')!.onclick = () => {
    window.location.href = 'popup.html';
};

document.addEventListener('DOMContentLoaded', (event) => {
    chrome.storage.local.get(['hideTags'], (result) => {
        let hideTagsBtnText = document.getElementById('toggle-show-tags-text');
        hideTagsBtnText!.textContent = result.hideTags ? '❌' : '✅';
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

document.getElementById('hide-tags-btn')!.addEventListener('click', function () {
    chrome.storage.local.get(['hideTags'], (result) => {
        const newHideTags = !result.hideTags;
        chrome.storage.local.set({ hideTags: newHideTags }, () => {
            document.getElementById('toggle-show-tags-text')!.textContent = newHideTags ? '❌' : '✅';

            // Manually trigger the update description after toggling 'hideTags'
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id!, { action: 'updateDescription', title: tabs[0].title || 'title' });
            });
        });
    });
});

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}