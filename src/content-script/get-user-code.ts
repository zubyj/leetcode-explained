/** 
 * 
 * Reads the user's code and examples from leetcode.com
 * 
 *  */

function getTestCases() {
    const testCases: string[] = [];
    const testCaseContainer = document.querySelector('div.space-y-4');

    if (testCaseContainer) {
        // Get all input fields
        const inputs = testCaseContainer.querySelectorAll('[data-e2e-locator="console-testcase-input"]');
        const labels = testCaseContainer.querySelectorAll('.text-xs.font-medium');

        // Combine labels with their values
        labels.forEach((label, index) => {
            const inputValue = inputs[index]?.textContent?.trim() || '';
            if (label.textContent && inputValue) {
                testCases.push(`${label.textContent} ${inputValue}`);
            }
        });
    }

    // Also try to get other test cases if they exist
    const testCaseButtons = document.querySelectorAll('[data-e2e-locator="console-testcase-button"]');
    if (testCaseButtons.length > 1) {
        testCases.push("\nNote: There are multiple test cases available.");
    }

    return testCases;
}

function getProblem() {
    let collectedData = []

    // Gets the problem description, examples, and constraints
    const examples = document.getElementsByClassName('elfjS')[0];
    if (examples && examples.children) {
        collectedData.push('\nHeres the description, examples, and constraints for the problem\n');
        for (const child of examples.children) {
            let text = child.textContent;
            if (text) collectedData.push(text);
        }
    }

    // Get the function definition and users code from the code editor
    const codeEditor = document.getElementsByClassName('view-line');
    if (codeEditor) {
        collectedData.push("\n--- Function Definition and Current Code ---\n");
        for (const viewLine of codeEditor) {
            let text = viewLine.textContent;
            if (text) collectedData.push(text);
        }
    }

    // Get test cases with improved selector
    const testCases = getTestCases();
    if (testCases.length > 0) {
        console.log('Test Cases:', testCases);
        collectedData.push("\n--- Test Cases ---\n" + testCases.join('\n'));
    }

    // Get any error messages from the output panel with improved selector
    const errorPanel = document.querySelector('div.font-menlo.whitespace-pre-wrap.break-all.text-xs.text-red-60');
    if (errorPanel) {
        const errorText = errorPanel.textContent?.trim();
        if (errorText) {
            console.log('Error from LeetCode:', errorText);
            collectedData.push("\n--- LeetCode Error Message ---\n" + errorText);
            collectedData.push("\nPlease fix the above error in the code.");
        }
    }

    return collectedData;
}

function getCodeComplexity() {
    const codeEditor = document.querySelector('[data-track-load="code_editor"]');
    if (!codeEditor) {
        return {
            code: '',
            language: '',
            error: 'Code editor not found'
        };
    }

    const code = (codeEditor as HTMLElement).innerText;
    const languageSelect = document.querySelector('[data-cy="lang-select"]') as HTMLElement;
    const language = languageSelect ? languageSelect.innerText : '';

    return {
        code: code,
        language: language
    };
}

// On get user code request, read & send the code as a response
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getProblem') {
        sendResponse({ data: getProblem() });
    }
    if (request.type === 'getCodeComplexity') {
        sendResponse({ data: getCodeComplexity() })
    }
});

