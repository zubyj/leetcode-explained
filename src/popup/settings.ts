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

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}