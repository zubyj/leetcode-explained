/** 
 * 
 * 1. Read the code from the code editor
 * 2. Read the test cases & examples from the problem page
 * 3. Send the code & test cases to the background script
 * 
 *  */

// Read the users code and examples from the Leetcode problem page
function getCode() {
    let textArray = []

    // Add the test cases & examples
    const examples = document.querySelectorAll('div.flex.h-full.w-full')[0];

    if (examples && examples.children) {
        textArray.push('\nHeres the description, examples, and constraints for the problem\n');
        for (const child of examples.children) {
            let text = child.textContent;
            if (text) textArray.push(text);
        }
    }

    // Get the function definition and users code from the code editor
    const codeEditor = document.getElementsByClassName('view-line');
    if (codeEditor) {
        textArray.push("heres the function definition and the users code which might be not present or might be incorrect.\n");
        for (const viewLine of codeEditor) {
            let text = viewLine.textContent;
            if (text) textArray.push(text);
        }
    }
    console.log('textarray ', textArray);
    return textArray;
}

// On get user code request, read & send the code as a response
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getCode') {
        sendResponse({ data: getCode() });
    }
    if (request.type === 'getCodeComplexity') {
        sendResponse({ data: getCodeComplexity() })
    }
});

