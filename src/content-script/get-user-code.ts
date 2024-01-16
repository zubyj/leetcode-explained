/** 
 * 
 * Reads the user's code and examples from leetcode.com
 * 
 *  */

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
        collectedData.push("heres the function definition and the users code which might be not present or might be incorrect.\n");
        for (const viewLine of codeEditor) {
            let text = viewLine.textContent;
            if (text) collectedData.push(text);
        }
    }

    return collectedData;
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

