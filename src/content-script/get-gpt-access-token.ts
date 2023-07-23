var browser = require("webextension-polyfill");

// Request the access token from the background script
browser.runtime.sendMessage({ type: 'GET_CHATGPT_ACCESS_TOKEN' }, (response) => {
    const accessToken = response.accessToken;
    if (accessToken) {
        browser.storage.local.set({ accessToken });
    } else {
        console.error('Error: Unable to get ChatGPT access token.');
    }
});
