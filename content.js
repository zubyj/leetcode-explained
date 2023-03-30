// Inject the CSS file
const link = document.createElement('link');
link.href = chrome.runtime.getURL('styles.css');
link.type = 'text/css';
link.rel = 'stylesheet';
document.head.appendChild(link);


// Injects the embedded youtube solution into the solutions tab of the Leetcode problem
function injectVideo(title) {
    // Get the solutions tab
    const solutionsTab = document.querySelectorAll('div.w-full.flex-col.overflow-auto')[1];
    if (!solutionsTab) {
        return;
    }

    // Check if the video has already been injected
    const existingIframe = solutionsTab.parentElement.querySelector('iframe');
    if (existingIframe) {
        return;
    }

    // Find the problem in the JSON file and get the embedded_url
    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problems = result.leetcodeProblems.questions;
        const problem = problems.find((problem) => problem.title === title);

        // Check if the problem has the embedded_url
        if (problem && problem.embedded_url) {
            // Create an iframe element and set its attributes
            const iframe = document.createElement('iframe');
            iframe.src = problem.embedded_url;
            iframe.allow = 'encrypted-media; picture-in-picture';
            iframe.allowFullscreen = true;

            // Insert the iframe element before the solutions tab
            solutionsTab.parentElement.insertBefore(iframe, solutionsTab);
        } else {
            console.log(`Unable to find problem with title ${title} in the JSON file`);
        }
    });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectVideo') {
        console.log('Injected the video');
        const title = request.title.split('-')[0].trim();
        injectVideo(title);
    }
});
