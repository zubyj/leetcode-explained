// Import the required modules
import { getChatGPTAccessToken } from '../background/chatgpt/chatgpt.js';

// Get the access token and store it
async function storeAccessToken() {
    try {
        const accessToken = await getChatGPTAccessToken();
        chrome.storage.local.set({ accessToken });
    } catch (error) {
        console.error('Error:', error);
    }
}

storeAccessToken();

