
// Injects the embedded youtube solution into the solutions tab of the Leetcode problem
function injectVideo(title) {
    // Get the solutions tab
    const solutionsTab = document.querySelectorAll('div.w-full.flex-col.overflow-auto')[1];
    if (!solutionsTab) {
        return;
    }

    // Check if the video has already been injected
    const existingVideo = solutionsTab.parentElement.querySelector('object');
    if (existingVideo) {
        return;
    }

    // Find the problem in the JSON file and get the embedded_url
    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problems = result.leetcodeProblems.questions;
        const problem = problems.find((problem) => problem.title === title);

        // Check if the problem has the embedded_url
        if (problem && problem.embedded_url) {
            // Create a container element and set its styles
            const container = document.createElement('div');
            container.classList.add('video-container');
            container.style.position = 'relative';
            container.style.paddingBottom = '56.25%'; // 16:9 aspect ratio

            // Create an object element and set its attributes
            const video = document.createElement('object');
            video.classList.add('youtube-video');
            video.type = 'text/html';
            video.data = problem.embedded_url;
            video.style.position = 'absolute';
            video.style.width = '85%';
            video.style.height = '100%';
            video.style.marginLeft = '7.5%';

            // Append the object element to the container element
            container.appendChild(video);

            // Insert the container element before the solutions tab
            solutionsTab.parentElement.insertBefore(container, solutionsTab);
        }
    });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectVideo') {
        const title = request.title.split('-')[0].trim();
        injectVideo(title);
    }
});