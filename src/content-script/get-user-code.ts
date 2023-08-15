/** 
 * 
 * 1. Read the code from the code editor
 * 2. Read the test cases & examples from the problem page
 * 3. Send the code & test cases to the background script
 * 
 *  */

// Read the users code and examples from the Leetcode problem page
function getCode() {

    // Get the function definition and users code from the code editor
    let textArray = ["heres the function definition and the users code which might be not present or might be incorrect.\n"]
    const codeEditor = document.getElementsByClassName('view-line');
    for (const viewLine of codeEditor) {
        let text = viewLine.textContent;
        if (text) textArray.push(text);
    }

    // Add the test cases & examples
    textArray.push('\nHeres the description, examples, and constraints for the problem\n');
    const examples = document.getElementsByClassName('xFUwe')[0];
    for (const child of examples.children) {
        let text = child.textContent;
        if (text) textArray.push(text);
    }
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

