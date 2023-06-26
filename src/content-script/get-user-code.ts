/* Reads the code from the user's code editor and sends it to the background script
*/

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getCode') {
        sendResponse({ data: getCode() });
    }
});

function getCode() {
    const viewLines = document.getElementsByClassName('view-line');
    const textArray = [];

    for (const viewLine of viewLines) {
        textArray.push(viewLine.textContent);
    }
    return textArray;
}
