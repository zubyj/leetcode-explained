// Reads the code from the user's code editor and sends it to the background script

// On get user code request, read & send the code as a response
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getCode') {
        sendResponse({ data: getCode() });
    }
});

// Read the users code and examples from the Leetcode problem page
function getCode() {
    const viewLines = document.getElementsByClassName('view-line');
    const textArray = ['Heres the code'];

    for (const viewLine of viewLines) {
        textArray.push(viewLine.textContent);
    }

    textArray.push('Heres the problem description, test cases, and constraints\n');

    // Add the test cases & examples to the 
    const descriptionContainer = document.querySelector('div._1l1MA') as Element;
    if (!descriptionContainer) {
        return;
    }

    // Add all the text from description container to the text array
    for (const child of descriptionContainer.children) {
        textArray.push(child.textContent);
    }

    const examples = descriptionContainer.getElementsByClassName('example');
    if (examples && examples.length > 0) {
        const parent = examples[0].parentNode as Element;
        if (!parent) {
            return;
        }
        const startIndex = Array.from(descriptionContainer.children).indexOf(parent);
        for (let i = startIndex; i < descriptionContainer.children.length; i++) {
            const child = descriptionContainer.children[i] as HTMLElement;
            console.log(child);
            child.style.display = showExamples ? 'block' : 'none';
        }
    }
    return textArray;
}
