export function loadLeetcodeData() {
    const jsonUrl = chrome.runtime.getURL('data/leetcode_solutions.json');

    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            chrome.storage.local.set({ leetcodeProblems: data }, () => { });
        })
        .catch(error => {
            console.error(error);
        });
}
