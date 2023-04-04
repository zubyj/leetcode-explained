function getSolutionsTab() {
    return document.querySelectorAll('div.w-full.flex-col.overflow-auto')[1];
}

function isVideoInjected(solutionsTab) {
    return solutionsTab.parentElement.querySelector('iframe') !== null;
}

function findProblemByTitle(title, problems) {
    return problems.find((problem) => problem.title === title);
}

function createContainerElement() {
    const container = document.createElement('div');
    container.classList.add('video-container');
    container.style.position = 'relative';
    container.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
    return container;
}

function createVideoElement(embeddedUrl) {
    const video = document.createElement('object');
    video.classList.add('youtube-video');
    video.type = 'text/html';
    video.data = embeddedUrl;
    video.style.position = 'absolute';
    video.style.width = '85%';
    video.style.height = '100%';
    video.style.marginLeft = '7.5%';
    return video;
}

function injectVideoIntoSolutionsTab(title, problems) {
    const solutionsTab = getSolutionsTab();
    if (!solutionsTab || isVideoInjected(solutionsTab)) {
        return;
    }

    const problem = findProblemByTitle(title, problems);
    if (!problem || !problem.embedded_url) {
        return;
    }

    const container = createContainerElement();
    const video = createVideoElement(problem.embedded_url);

    container.appendChild(video);
    solutionsTab.parentElement.insertBefore(container, solutionsTab);
}

function injectVideo(title) {
    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problems = result.leetcodeProblems.questions;
        const cleanTitle = title.split('-')[0].trim();
        injectVideoIntoSolutionsTab(cleanTitle, problems);
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectVideo') {
        injectVideo(request.title);
    }
});
