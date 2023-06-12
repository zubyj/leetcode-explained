document.getElementById('home-button')!.onclick = () => {
    window.location.href = 'popup.html';
};

document.getElementById('toggle-video')!.onclick = () => {
    chrome.storage.local.get('hideVideo', (data) => {
        const hideVideo = data.hideVideo;
        const updatedHideVideo = !hideVideo;
        chrome.storage.local.set({ hideVideo: updatedHideVideo }, () => {
            if (updatedHideVideo) {
                document.getElementById('hide-icon')!.classList.add('hidden');
                document.getElementById('show-icon')!.classList.remove('hidden');
                document.getElementById('toggle-text')!.textContent = 'Show';
            } else {
                document.getElementById('hide-icon')!.classList.remove('hidden');
                document.getElementById('show-icon')!.classList.add('hidden');
                document.getElementById('toggle-text')!.textContent = 'Hide';
            }
            sendMessageToActiveTab({ type: 'TOGGLE_SOLUTION_VIDEO' });
        });
    });
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