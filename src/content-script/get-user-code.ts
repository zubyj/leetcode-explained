/** 
 * 
 * Reads the user's code and examples from leetcode.com
 * 
 *  */

function getConsoleData() {
    const results: string[] = [];
    const testCaseContainer = document.querySelector('div.space-y-4');

    // Get test cases
    if (testCaseContainer) {
        const inputs = testCaseContainer.querySelectorAll('[data-e2e-locator="console-testcase-input"]');
        const labels = testCaseContainer.querySelectorAll('.text-xs.font-medium');

        labels.forEach((label, index) => {
            const inputValue = inputs[index]?.textContent?.trim() || '';
            if (label.textContent && inputValue) {
                results.push(`${label.textContent} ${inputValue}`);
            }
        });
    }

    // Get output and expected output
    const containers = document.querySelectorAll('div.flex.h-full.w-full.flex-col.space-y-2');
    Array.from(containers).forEach(container => {
        const label = container.querySelector('div.flex.text-xs.font-medium');
        const valueDiv = container.querySelector('div.font-menlo.relative.mx-3.whitespace-pre-wrap');
        const value = valueDiv?.textContent?.trim() || '';

        if (label?.textContent?.includes('Output') && value) {
            results.push(`Current Output: ${value}`);
        } else if (label?.textContent?.includes('Expected') && value) {
            results.push(`Expected Output: ${value}`);
        }
    });

    // Check for multiple test cases
    const testCaseButtons = document.querySelectorAll('[data-e2e-locator="console-testcase-button"]');
    if (testCaseButtons.length > 1) {
        results.push("\nNote: There are multiple test cases available.");
    }

    return results;
}

function getProblem() {
    let collectedData = []

    // Gets the problem description, examples, and constraints
    const examples = document.getElementsByClassName('elfjS')[0];
    if (examples && examples.children) {
        collectedData.push('\nHeres the description, examples, and constraints for the problem\n');
        Array.from(examples.children).forEach(child => {
            let text = child.textContent;
            if (text) collectedData.push(text);
        });
    }

    // Get the function definition and users code from the code editor
    const codeEditor = document.getElementsByClassName('view-line');
    if (codeEditor) {
        collectedData.push("\n--- Function Definition and Current Code ---\n");
        Array.from(codeEditor).forEach(viewLine => {
            let text = viewLine.textContent;
            if (text) collectedData.push(text);
        });
    }

    // Get test cases, output, and expected output
    const consoleData = getConsoleData();
    if (consoleData.length > 0) {
        //console.log('Console Data:', consoleData);
        collectedData.push("\n--- Test Cases and Results ---\n" + consoleData.join('\n'));
    }

    // Get any error messages from the output panel with improved selector
    const errorPanel = document.querySelector('div.font-menlo.whitespace-pre-wrap.break-all.text-xs.text-red-60');
    if (errorPanel) {
        const errorText = errorPanel.textContent?.trim();
        if (errorText) {
            //console.log('Error from LeetCode:', errorText);
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

