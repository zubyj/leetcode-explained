chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getCode') {
        sendResponse({ data: getCode() });
    }
});

// use the chrome api to check if the mouse is being clicked


function getCode() {
    const viewLines = document.getElementsByClassName('view-line');
    const textArray = [];

    for (const viewLine of viewLines) {
        textArray.push(viewLine.textContent);
    }
    return textArray;
}