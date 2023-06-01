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

document.getElementById('toggle-features')!.onclick = () => {
    const featureList = document.getElementById('features-list');
    const featureIcon = document.getElementById('toggle-features-icon');
    const displayValue = window.getComputedStyle(featureList).getPropertyValue('display');

    if (displayValue === 'none') {
        featureList.style.display = 'block';
        featureIcon.src = '../../assets/images/collapse-icon.png';
    } else {
        featureList.style.display = 'none';
        featureIcon.src = '../../assets/images/expand-icon.png';
    }
};

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}