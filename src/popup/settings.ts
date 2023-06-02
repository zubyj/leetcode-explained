document.getElementById('home-button')!.onclick = () => {
    window.location.href = 'popup.html';
};

document.getElementById('toggle-video')!.onclick = () => {
    // Toggle the boolean value in Chrome local storage
    chrome.storage.local.get('hideVideo', (data) => {
        const hideVideo = data.hideVideo;
        const updatedHideVideo = !hideVideo;
        chrome.storage.local.set({ hideVideo: updatedHideVideo }, () => {
            if (updatedHideVideo) {
                document.getElementById('toggleText')!.textContent = 'Show';
            } else {
                document.getElementById('toggleText')!.textContent = 'Hide';
            }
            sendMessageToActiveTab({ type: 'TOGGLE_SOLUTION_VIDEO' });
        });
    });
};

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}

// Get the currently selected language from local storage and set the dropdown's value
chrome.storage.local.get('selectedLanguage', (data) => {
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    if (data.selectedLanguage) {
        languageSelect.value = data.selectedLanguage;
    } else {
        // If there's no stored language selection, default to Python
        languageSelect.value = "python";
    }
});

// Listen for changes to the dropdown's selection
document.getElementById('language-select')!.onchange = () => {
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    // Store the selected language in local storage
    chrome.storage.local.set({ selectedLanguage: languageSelect.value });
};