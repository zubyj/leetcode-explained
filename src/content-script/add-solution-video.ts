/**
 * Creates a video container element with the provided video URL.
 * @param {string} videoUrl - The video URL.
 * @return {HTMLDivElement} - The video container element.
 */
function createVideoContainer(videoUrl: string): HTMLDivElement {
    const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

    const container = document.createElement('div');
    container.classList.add('video-container');
    container.style.position = 'relative';
    container.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;

    const iframe = document.createElement('iframe');
    iframe.classList.add('youtube-video');
    iframe.src = videoUrl;
    iframe.style.position = 'absolute';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    return container;
}

interface LeetCodeProblem {
    title: string;
    embedded_url: string;
    // add more properties as needed
}

/**
 * Injects the embedded YouTube solution into the solutions tab of the LeetCode problem.
 * @param {string} title - The problem title.
 */
function addVideo(title: string): void {
    const SOLUTIONS_TAB_INDEX = 1;

    const solutionsTab = document.querySelectorAll<HTMLDivElement>('div.w-full.flex-col.overflow-auto')[SOLUTIONS_TAB_INDEX];
    if (!solutionsTab) return;

    const existingContainer = solutionsTab.parentElement?.querySelector<HTMLDivElement>('div.video-container');
    if (existingContainer) return;

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problems = result.leetcodeProblems.questions;
        const problem = problems.find((problem: LeetCodeProblem) => problem.title === title);

        if (problem && problem.embedded_url) {
            const container = createVideoContainer(problem.embedded_url);
            solutionsTab.parentElement?.insertBefore(container, solutionsTab);
        }
    });
}


/**
 * Handles incoming messages from the background script.
 */
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'addVideo') {
        const title = request.title.split('-')[0].trim();
        addVideo(title);
    }
});

/**
 * This code is used to prevent the iframe from freezing when its being resized while the mouse is hovering over it
 */
window.addEventListener('mousedown', () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.youtube-video');
    if (iframe) {
        iframe.style.pointerEvents = 'none';
    }
});

window.addEventListener('mouseup', () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.youtube-video');
    if (iframe) {
        iframe.style.pointerEvents = 'auto';
    }
});
