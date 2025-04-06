/*
Contains the logic behind the popup window that appears when the extension icon is clicked.
Creates the AI buttons, sets the prompts, and displays the responses.
The user can also copy the code to their clipboard, clear the code, and open the settings page.
*/

import { initializeTheme } from '../utils/theme.js';
import { OpenRouterProvider } from '../background/openrouter/openrouter.js';

// Add interface for AIProvider at the top level
interface AIProvider {
    generateAnswer(params: {
        prompt: string,
        onEvent: (arg: { type: string, data?: { text: string } }) => void,
        action: 'analyze' | 'fix'
    }): Promise<void>;
}

/* Element selectors */
const selectors: { [key: string]: string } = {
    fixCodeBtn: 'fix-code-btn',
    getComplexityBtn: 'get-complexity-btn',
    infoMessage: 'info-message',
    analyzeCodeResponse: 'analyze-code-response',
    fixCodeResponse: 'fix-code-response',
    fixCodeContainer: 'fix-code-container',
    codeBtnContainer: 'code-btn-container',
    copyCodeBtn: 'copy-code-btn',
    clearCodeBtn: 'clear-code-btn',
    openSettingsBtn: 'open-settings-btn',

};

/* Chrome storage keys */
const storageKeys: { [key: string]: string } = {
    analyzeCodeResponse: 'analyzeCodeResponse',
    fixCodeResponse: 'fixCodeResponse',
    lastAction: 'lastAction',
    currentLeetCodeProblemTitle: 'currentLeetCodeProblemTitle',
};

/* Retrieve elements from DOM */
const elements: { [key: string]: HTMLElement | null } = {};
for (const key in selectors) {
    if (key) elements[key] = document.getElementById(selectors[key]);
}


const analyzeCodeResponse = elements['analyzeCodeResponse'];
const fixCodeResponse = elements['fixCodeResponse'];
const infoMessage = elements['infoMessage'];
const fixCodeContainer = elements['fixCodeContainer'];

/* Helper functions */
function disableAllButtons(disabled: boolean): void {
    let fixCodeButton = elements['fixCodeBtn'] as HTMLButtonElement;
    let getComplexityButton = elements['getComplexityBtn'] as HTMLButtonElement;

    // Use the arguments to determine if a specific button should be disabled
    fixCodeButton && (fixCodeButton.disabled = disabled);
    getComplexityButton && (getComplexityButton.disabled = disabled);
}

function clearResponse(): void {
    if (analyzeCodeResponse) analyzeCodeResponse.textContent = '';
    if (fixCodeResponse) fixCodeResponse.textContent = '';
    if (fixCodeContainer) fixCodeContainer.classList.add('hidden');
    if (analyzeCodeResponse) analyzeCodeResponse.classList.add('hidden');
    chrome.storage.local.set({ 'fixCodeResponse': '' });
    chrome.storage.local.set({ 'analyzeCodeResponse': '' });
}

function initActionButton(buttonId: string, action: 'analyze' | 'fix', aiProvider: AIProvider): void {
    const actionButton = document.getElementById(buttonId);
    if (!actionButton) return;
    actionButton.onclick = async () => {
        const codeText = await getCodeFromActiveTab();
        if (codeText) {
            console.log(codeText);
            processCode(aiProvider, codeText, action);
        } else {
            const errorMessage = "Cannot read from page. Please open a Leetcode problem and refresh the page.";
            setInfoMessage(errorMessage, 5000);
        }
    };
}

async function getCodeFromActiveTab(): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id as number,
                { type: 'getProblem' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        resolve(null);
                    } else {
                        resolve(response.data);
                    }
                },
            );
        });
    });
}

function timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${ms} ms`)), ms)
    );
}

function formatResponseText(text: string): string {
    return text
        .replace(/time/gi, '<span style="color: lightgreen;">time complexity</span>')
        .replace(/space/gi, '<span style="color: lightgreen;">space complexity</span>');
}

function stripMarkdownCodeBlock(text: string): string {
    // Remove any text between the first set of ```
    text = text.replace(/```[^\n]*\n/, '');
    // Remove trailing ```
    text = text.replace(/```$/, '');
    return text;
}

function setInfoMessage(message: string, duration: number, isError: boolean = false) {
    if (!infoMessage) return;
    const oldMessage = infoMessage.textContent;
    infoMessage.textContent = message;
    
    // Add error styling if it's an error
    if (isError) {
        infoMessage.style.color = '#ff4444';
    }
    
    setTimeout(() => {
        infoMessage.textContent = oldMessage;
        infoMessage.style.color = ''; // Reset color
    }, duration);
}

function processCode(
    aiProvider: AIProvider,
    codeText: string,
    action: 'analyze' | 'fix',
): void {
    disableAllButtons(true);
    clearResponse();

    const problemTitle = infoMessage && infoMessage.textContent;

    let prompt = '';
    if (action === 'analyze') {
        prompt = `
        As an experienced software engineer, please analyze the code complexity of the Leetcode
        problem titled ${problemTitle} and the accompanying code below. The output (return value) of 
        the function should not be factored into the time and space complexity of the function.
        Return the time and space complexity of the function in big O notation. Your analysis should be direct and concise
        with no more than two sentences. The problem description and code are provided below\n. ${codeText}`;
        if (infoMessage) infoMessage.textContent = 'Analyzing code complexity ...';

        if (analyzeCodeResponse) analyzeCodeResponse.classList.remove('hidden');
        if (fixCodeContainer) fixCodeContainer.classList.add('hidden');
    }
    else if (action === 'fix') {
        // ... existing prompt setup ..        // Prompt for generating solution code
        prompt = `
        As a coding professional, I need your expertise with a specific LeetCode problem named ${problemTitle}.
        Please follow the instructions:
        1. If no code is provided: Generate an efficient and accurate solution for the problem.
        2. If code is provided and contains errors: Identify the issues, correct them, and optimize the code if possible.
        3. If the provided code is already correct and optimized: Simply return it as-is.
        IMPORTANT: Your response should only include the function definition and code solution in plain text format (no backticks, code blocks, or additional formatting).
        Do not explain your solution or provide any additional information other than the code.
        Here's the problem description and code:\n
        ${codeText}.`;

        if (infoMessage) infoMessage.textContent = 'Generating solution code ...';
        analyzeCodeResponse && analyzeCodeResponse.classList.add('hidden');
        fixCodeContainer && fixCodeContainer.classList.remove('hidden');
    }

    let response = '';
    Promise.race([
        aiProvider.generateAnswer({
            prompt: prompt,
            action: action,
            onEvent: (event: { type: string; data?: { text: string } }) => {
                if (event.type === 'error' && event.data) {
                    // Handle error events
                    setInfoMessage(event.data.text, 5000, true);
                    disableAllButtons(false);
                    return;
                }
                
                if (event.type === 'answer' && event.data) {
                    if (action === 'fix' && fixCodeResponse) {
                        response += event.data.text;
                        fixCodeResponse.textContent = stripMarkdownCodeBlock(response);
                        (window as any).Prism.highlightAll();
                    }
                    else if (action === 'analyze' && analyzeCodeResponse) {
                        response += formatResponseText(event.data.text);
                        analyzeCodeResponse.innerHTML = response;
                    }
                }
                if (event.type === 'done') {
                    disableAllButtons(false);
                    chrome.storage.local.set({ 'lastAction': action });
                    infoMessage && (infoMessage.textContent = problemTitle);
                    if (action === 'fix') {
                        fixCodeResponse && chrome.storage.local.set({ 'fixCodeResponse': fixCodeResponse.textContent });
                        (window as any).Prism.highlightAll();
                    }
                    if (action === 'analyze') {
                        analyzeCodeResponse && chrome.storage.local.set({ 'analyzeCodeResponse': analyzeCodeResponse.innerHTML });
                    }
                }
            },
        }),
        timeout(20000)
    ]).catch((error) => {
        setInfoMessage(error.message, 5000, true);
        console.error(error);
        disableAllButtons(false);
    });
} 

async function loadStoredData(): Promise<void> {
    const [analyzeCodeResponseStored, fixCodeResponseStored, lastAction] = await Promise.all([
        getFromStorage(storageKeys.analyzeCodeResponse),
        getFromStorage(storageKeys.fixCodeResponse),
        getFromStorage(storageKeys.lastAction),
    ]) as [string, string, string];

    if (analyzeCodeResponseStored && lastAction === 'analyze') {
        analyzeCodeResponse && (analyzeCodeResponse.innerHTML = analyzeCodeResponseStored);
        analyzeCodeResponse?.classList.remove('hidden');
    }

    if (fixCodeResponseStored && lastAction === 'fix') {
        fixCodeResponse && (fixCodeResponse.textContent = fixCodeResponseStored);
        fixCodeContainer?.classList.remove('hidden');
        (window as any).Prism.highlightAll();
    }
}

async function main(): Promise<void> {
    initializeTheme();
    initializeScaleFactor();
    await loadStoredData();

    // get name of current tab and set info message, also check theme if in auto mode
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab.url && tab.url.includes('leetcode.com/problems')) {
            chrome.storage.local.set({ 'currentLeetCodeProblemTitle': tab.title });
            if (tab.title && infoMessage) {
                infoMessage.textContent = tab.title.split('-')[0];
            }
            
            // Check if we're in auto mode and need to sync theme
            chrome.storage.local.get(['themeMode'], (result) => {
                if (result.themeMode === 'auto') {
                    // Send a message to detect theme
                    chrome.tabs.sendMessage(
                        tab.id as number,
                        { action: 'getTheme' },
                        (response) => {
                            if (!chrome.runtime.lastError && response && response.theme) {
                                // Apply detected theme
                                document.documentElement.setAttribute('data-theme', response.theme);
                                chrome.storage.local.set({ 
                                    isDarkTheme: response.theme === 'dark'
                                });
                            }
                        }
                    );
                }
            });
        }
    });

    elements['openSettingsBtn'] && (elements['openSettingsBtn'].onclick = () => {
        window.location.href = 'settings.html';
    });

    try {
        const openRouterProvider = new OpenRouterProvider();
        initActionButton('get-complexity-btn', 'analyze', openRouterProvider);
        initActionButton('fix-code-btn', 'fix', openRouterProvider);
        initCopyButton();
        initClearButton();
        elements['getComplexityBtn']?.classList.remove('hidden');
        elements['fixCodeBtn']?.classList.remove('hidden');
    } catch (error) {
        console.log(error);
    }
}

// Function to initialize scale factor based on saved font size
function initializeScaleFactor(): void {
    chrome.storage.local.get('fontSize', function (data) {
        if (data.fontSize) {
            let scaleFactor: number;
            const fontSize = data.fontSize.toString();
            
            switch (fontSize) {
                case '12':
                    scaleFactor = 0.9;
                    break;
                case '16':
                    scaleFactor = 1.1;
                    break;
                default: // 14px is the default
                    scaleFactor = 1.0;
                    break;
            }
            
            document.documentElement.style.setProperty('--scale-factor', scaleFactor.toString());
        } else {
            // Default to small if not set
            document.documentElement.style.setProperty('--scale-factor', '0.9');
            chrome.storage.local.set({ fontSize: 12 });
        }
    });
}

// Remove displayApiKeyMessage function since it's no longer needed

function initCopyButton(): void {
    const copyButton = elements['copyCodeBtn'];
    if (!copyButton) return;
    copyButton.onclick = async () => {
        setInfoMessage('Copied Code', 1000);
        // Change icon to check-icon.png
        const copyButtonImg = copyButton.querySelector('img');
        if (copyButtonImg) {
            copyButtonImg.src = '../assets/images/check-icon.png';
            // After 1 second, change the icon back to the copy icon
            setTimeout(() => {
                copyButtonImg.src = '../assets/images/copy-icon.png';
            }, 1000);
        }
        
        if (fixCodeResponse && fixCodeResponse.textContent) {
            await navigator.clipboard.writeText(fixCodeResponse.textContent);
        }
    };
    copyButton.classList.remove('hidden');
}

function initClearButton(): void {
    const clearButton = elements['clearCodeBtn'];
    clearButton && (clearButton.onclick = async () => {
        setInfoMessage('Cleared Response', 3000);
        clearResponse();
    });
}


chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'setTabInfo') {
        const urlPattern = /^https:\/\/leetcode\.com\/problems\/.*\/?/;
        if (message.url.match(urlPattern)) {
            infoMessage && (infoMessage.textContent = message.title);
        }
    }
});

/* Utility functions */
function getFromStorage(key: string): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (data) => resolve(data[key] || ''));
    });
}

/* Run the main function */
main();
