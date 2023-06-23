const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

/**
 * Creates a video container element with the provided video URL.
 * @param {string} videoUrl - The video URL.
 * @param {string} channelName - The name of the YouTube channel.
 * @param {Array} companies - The array of company problems.
 * @return {HTMLDivElement} - The video container element.
 */
function createVideoContainer(videoUrl, channelName, companies) {
    const container = document.createElement('div');
    container.classList.add('video-container');
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
    container.style.marginBottom = '60px';

    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'center';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.width = '100%';
    controlsContainer.style.paddingTop = '10px';
    controlsContainer.style.boxSizing = 'border-box';
    controlsContainer.style.color = '#fff';
    container.appendChild(controlsContainer);

    const prevButton = document.createElement('button');
    prevButton.style.fontSize = '20px';
    prevButton.textContent = '⬅️';
    prevButton.classList.add('prev-video');
    controlsContainer.appendChild(prevButton);

    const channelElement = document.createElement('div');
    channelElement.style.fontSize = '15px';
    channelElement.textContent = channelName;
    channelElement.style.textAlign = 'center';
    channelElement.style.width = '200px';
    controlsContainer.appendChild(channelElement);

    const nextButton = document.createElement('button');
    nextButton.style.fontSize = '20px';
    nextButton.textContent = '➡️';
    nextButton.classList.add('next-video');
    controlsContainer.appendChild(nextButton);

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide Video';
    toggleButton.classList.add('toggle-video');
    toggleButton.style.marginLeft = '50px';
    toggleButton.style.border = '1px solid white';
    toggleButton.style.borderRadius = '5px';
    toggleButton.style.padding = '5px 10px';
    controlsContainer.appendChild(toggleButton);

    const companyDropdown = document.createElement('select');
    companyDropdown.name = 'Companies';
    // Set default text to "Companies"
    companyDropdown.style.marginLeft = '20px';
    companyDropdown.style.border = '1px solid white';
    companyDropdown.style.borderRadius = '5px';
    companyDropdown.style.padding = '5px 10px';
    companyDropdown.style.height = '35px';

    companies.forEach((company) => {
        const option = document.createElement('option');
        option.value = company.name;
        option.textContent = `⭐ ${company.score}  ${company.name} <img src="./src/assets/images/${company.name}.png" width="20px" height="20px">`;

        // set the 

        companyDropdown.appendChild(option);
    });

    controlsContainer.appendChild(companyDropdown);

    const iframe = document.createElement('iframe');
    iframe.classList.add('youtube-video');
    iframe.src = videoUrl;
    iframe.style.display = 'flex';
    iframe.style.justifyContent = 'center';
    iframe.style.position = 'absolute';
    iframe.style.top = '60px'; // Adjust this value based on the height of your controlsContainer
    iframe.style.width = '95%';
    iframe.style.height = '95%';
    iframe.style.border = '1px solid grey';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    container.iframe = iframe;
    container.channelElement = channelElement;
    container.companyDropdown = companyDropdown;

    return container;
}

interface LeetCodeProblem {
    title: string;
    videos: {
        embedded_url: string;
        channel: string;
    }[];
    companies?: {
        name: string;
        score: string;
    }[];
    // add more properties as needed
}

/**
 * Injects the embedded YouTube solution into the solutions tab of the LeetCode problem.
 * @param {string} title - The problem title.
 */
function addVideo(title) {
    const SOLUTIONS_TAB_INDEX = 1;

    const solutionsTab = document.querySelectorAll('div.w-full.flex-col.overflow-auto')[SOLUTIONS_TAB_INDEX];
    if (!solutionsTab) return;

    const existingContainer = solutionsTab.parentElement?.querySelector('div.video-container');
    if (existingContainer) return;

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problems = result.leetcodeProblems.questions;
        const problem = problems.find((problem) => problem.title === title);

        if (problem?.videos?.length) {
            let currentVideoIndex = 0;
            const container = createVideoContainer(
                problem.videos[currentVideoIndex].embedded_url,
                problem.videos[currentVideoIndex].channel,
                problem.companies || []
            );
            solutionsTab.parentElement?.insertBefore(container, solutionsTab);

            const prevButton = container.querySelector('button.prev-video');
            const nextButton = container.querySelector('button.next-video');

            prevButton?.addEventListener('click', () => {
                currentVideoIndex = (currentVideoIndex - 1 + problem.videos.length) % problem.videos.length;
                updateVideo(
                    container,
                    problem.videos[currentVideoIndex].embedded_url,
                    problem.videos[currentVideoIndex].channel,
                    container.companyDropdown.value
                );
            });

            nextButton?.addEventListener('click', () => {
                currentVideoIndex = (currentVideoIndex + 1) % problem.videos.length;
                updateVideo(
                    container,
                    problem.videos[currentVideoIndex].embedded_url,
                    problem.videos[currentVideoIndex].channel,
                    container.companyDropdown.value
                );
            });

            const toggleButton = container.querySelector('button.toggle-video');
            toggleButton?.addEventListener('click', () => {
                const videoContainer = document.querySelector('div.video-container');
                if (videoContainer) {
                    videoContainer.style.paddingBottom = videoContainer.style.paddingBottom === '0%' ? `${VIDEO_ASPECT_RATIO}% ` : '0%';
                    toggleButton.textContent = videoContainer.style.paddingBottom === '0%' ? 'Show Video' : 'Hide Video';
                }
            });

            // on hover, change background color of toggleButton
            toggleButton?.addEventListener('mouseover', () => {
                toggleButton.style.backgroundColor = '#fff';
                toggleButton.style.color = '#000';
            });

            toggleButton?.addEventListener('mouseout', () => {
                toggleButton.style.backgroundColor = 'transparent';
                toggleButton.style.color = '#fff';
            });
        }
        if (problem.companies) {
            console.log('companies');
            console.log(problem.companies);
        }
    });
}

function updateVideo(container, videoUrl, channelName, selectedCompany) {
    container.iframe.src = videoUrl;
    container.channelElement.textContent = channelName;
    container.companyDropdown.value = selectedCompany;
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
 * This code is used to prevent the iframe from freezing when it's being resized while the mouse is hovering over it.
 */
window.addEventListener('mousedown', () => {
    const iframe = document.querySelector('iframe.youtube-video');
    if (iframe) {
        iframe.style.pointerEvents = 'none';
    }
});

window.addEventListener('mouseup', () => {
    const iframe = document.querySelector('iframe.youtube-video');
    if (iframe) {
        iframe.style.pointerEvents = 'auto';
    }
});
