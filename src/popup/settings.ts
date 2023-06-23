document.getElementById('home-button')!.onclick = () => {
    window.location.href = 'popup.html';
};

// Getting element and checking if the language is already set in local storage
let languageSelect = document.getElementById('language-select');
chrome.storage.local.get('language', function (data) {
    if (data.language) {
        languageSelect!.value = data.language;
    } else {
        languageSelect!.value = 'python';
    }
});

// Change the language on selection
languageSelect!.onchange = function () {
    let selectedLanguage = this.value;
    chrome.storage.local.set({ language: selectedLanguage });
};

// Get font fize and check if it is already set in local storage
let fontSizeSelect = document.getElementById('font-size-select');
chrome.storage.local.get('fontSize', function (data) {
    if (data.fontSize) {
        fontSizeSelect!.value = data.fontSize;
    }
});

fontSizeSelect!.onchange = function () {
    let selectedFontSize = this.value;
    chrome.storage.local.set({ fontSize: selectedFontSize });
};

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}