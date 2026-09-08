import { initChatGPTRelay } from './chatgpt-relay/chatgpt-relay.js';

initChatGPTRelay();

function getRandomToken(): string {
    const randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    return Array.from(randomPool)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get('userId', (items) => {
        if (!items.userId) {
            chrome.storage.sync.set({ userId: getRandomToken() });
        }
    });

    const dataFiles: Array<[string, string]> = [
        ['leetcodeProblems', 'src/assets/data/problem_data.json'],
        ['companyProblems', 'src/assets/data/problems_by_company.json'],
    ];
    dataFiles.forEach(([key, path]) => {
        fetch(chrome.runtime.getURL(path))
            .then((response) => response.json())
            .then((data) => chrome.storage.local.set({ [key]: data }))
            .catch((error) => console.error(`Failed to load ${key}:`, error));
    });

    // Fill in defaults without clobbering settings existing users already chose.
    const defaults = {
        fontSize: 12,
        showExamples: true,
        showDifficulty: true,
        showCompanyTags: true,
        useChatGPT: true,
        themeMode: 'auto',
        isDarkTheme: true,
    };
    chrome.storage.local.get(Object.keys(defaults), (existing) => {
        const missing: Record<string, unknown> = {};
        Object.entries(defaults).forEach(([key, value]) => {
            if (existing[key] === undefined) missing[key] = value;
        });
        if (Object.keys(missing).length) chrome.storage.local.set(missing);
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'settingsUpdate') {
        chrome.tabs.query({ url: 'https://leetcode.com/problems/*' }, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdate' });
            });
        });
        return;
    }

    if (request.action === 'openCompanyPage') {
        chrome.storage.local.set({ clickedCompany: request.company }, () => {
            chrome.tabs.create({
                url: chrome.runtime.getURL('src/problems-by-company/company.html'),
                active: true,
            });
        });
    }
});
