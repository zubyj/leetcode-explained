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

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}