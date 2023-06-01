document.getElementById('home-button')!.onclick = () => {
    window.location.href = 'popup.html';
};

document.getElementById('settings-form')!.onsubmit = (e) => {
    e.preventDefault();
    const fontSize = document.getElementById('font-size')!.value;
    chrome.storage.sync.set({ 'fontSize': fontSize }, () => {
        alert('Settings saved');
    });
};

window.onload = () => {
    chrome.storage.sync.get('fontSize', (data) => {
        document.getElementById('font-size')!.value = data.fontSize;
    });
};

function sendMessageToActiveTab(message: object): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, message);
    });
}

document.getElementById('toggle-video')!.onclick = () => {
    sendMessageToActiveTab({ type: 'TOGGLE_SOLUTION_VIDEO' });
};

