/* 
    Reads the code from the user's code editor and sends it to the background script 
*/

// On get user code request, read & send the code as a response
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getCode') {
        sendResponse({ data: getCode() });
    }
});

// Read the users code from the Leetcode problem page
function getCode() {
    const viewLines = document.getElementsByClassName('view-line');
    const textArray = [];

    for (const viewLine of viewLines) {
        textArray.push(viewLine.textContent);
    }
    return textArray;
}
