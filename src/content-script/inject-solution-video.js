/**
 * Creates a video container element with the provided video URL.
 * @param {string} videoUrl - The video URL.
 * @return {HTMLDivElement} - The video container element.
 */
function createVideoContainer(videoUrl) {
    const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

    const container = document.createElement('div');
    container.classList.add('video-container');
    container.style.position = 'relative';
    container.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;

    const video = document.createElement('object');
    video.classList.add('youtube-video');
    video.type = 'text/html';
    video.data = videoUrl;
    video.style.position = 'absolute';
    video.style.width = '90%';
    video.style.height = '100%';

    container.appendChild(video);
    return container;
}

/**
 * Injects the embedded YouTube solution into the solutions tab of the LeetCode problem.
 * @param {string} title - The problem title.
 */
function injectVideo(title) {
    const SOLUTIONS_TAB_INDEX = 1;

    const solutionsTab = document.querySelectorAll('div.w-full.flex-col.overflow-auto')[SOLUTIONS_TAB_INDEX];
    if (!solutionsTab) return;

    const existingContainer = solutionsTab.parentElement.querySelector('div.video-container');
    if (existingContainer) return;

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problems = result.leetcodeProblems.questions;
        const problem = problems.find((problem) => problem.title === title);

        if (problem && problem.embedded_url) {
            const container = createVideoContainer(problem.embedded_url);
            solutionsTab.parentElement.insertBefore(container, solutionsTab);
        }
    });
}

/**
 * Handles incoming messages from the background script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectVideo') {
        const title = request.title.split('-')[0].trim();
        injectVideo(title);
    }
});
