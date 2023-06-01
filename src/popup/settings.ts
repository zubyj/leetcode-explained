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
