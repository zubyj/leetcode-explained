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
    console.log('textArray' + textArray)
    return textArray;
}