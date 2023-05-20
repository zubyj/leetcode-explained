// Request the access token from the background script
chrome.runtime.sendMessage({ type: 'GET_CHATGPT_ACCESS_TOKEN' }, (response) => {
    const accessToken = response.accessToken;
    if (accessToken) {
        chrome.storage.local.set({ accessToken });
    } else {
        console.error('Error: Unable to get ChatGPT access token.');
    }
});
