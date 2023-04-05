function getCode() {
    const viewLines = document.getElementsByClassName('view-line');
    console.log('view lines ' + viewLines);
    const textArray = [];

    for (const viewLine of viewLines) {
        textArray.push(viewLine.textContent);
    }

    return textArray;
}

chrome.runtime.sendMessage({ type: "viewLineText", data: getCode() });
