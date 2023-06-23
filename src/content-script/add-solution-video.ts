const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio
/**
 * Creates a video container element with the provided video URL.
 * @param {string} videoUrl - The video URL.
 * @param {string} channelName - The name of the YouTube channel.
 * @param {Array} companies - The array of company problems.
 * @return {HTMLDivElement} - The video container element.
 */

function createStyledElement(tagName, styles = {}) {
    const element = document.createElement(tagName);
    for (let [key, value] of Object.entries(styles)) {
        element.style[key] = value;
    }
    return element;
}

function createButton(content, className, styles = {}) {
    const button = createStyledElement('button', styles);
    button.textContent = content;
    button.classList.add(className);
    return button;
}

function createSelect(name, companies, styles = {}) {
    const select = createStyledElement('select', styles);
    select.name = name;

    companies.forEach((company) => {
        const option = document.createElement('option');
        option.value = company.name;
        option.textContent = `⭐ ${company.score}  ${company.name}`;
        select.appendChild(option);
    });

    return select;
}

function createControlsContainer(channelName, companies) {
    const controlsContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        paddingTop: '10px',
        boxSizing: 'border-box',
        color: '#fff'
    });

    const prevButton = createButton('⬅️', 'prev-video', { fontSize: '20px' });
    const channelElement = createStyledElement('div', {
        fontSize: '15px',
        textAlign: 'center',
        width: '150px'
    });
    channelElement.textContent = channelName;
    const nextButton = createButton('➡️', 'next-video', { fontSize: '20px' });

    const toggleButtonStyles = {
        marginLeft: '40px',
        border: '1px solid white',
        borderRadius: '5px',
        padding: '5px 10px'
    };
    const toggleButton = createButton('Hide Video', 'toggle-video', toggleButtonStyles);

    const selectStyles = {
        marginLeft: '20px',
        border: '1px solid white',
        borderRadius: '5px',
        padding: '5px 10px',
        height: '35px'
    };
    const companyDropdown = createSelect('Companies', companies, selectStyles);

    controlsContainer.append(prevButton, channelElement, nextButton, toggleButton, companyDropdown);

    return { controlsContainer, prevButton, nextButton, toggleButton, companyDropdown };
}

function createVideoContainer(videoUrl, channelName, companies) {
    const container = createStyledElement('div', {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: `${VIDEO_ASPECT_RATIO}%`,
        marginBottom: '60px'
    });
    container.classList.add('video-container');

    const { controlsContainer, prevButton, nextButton, toggleButton, companyDropdown } = createControlsContainer(channelName, companies);

    const iframe = createStyledElement('iframe', {
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        top: '60px',
        width: '95%',
        height: '95%',
        border: '1px solid grey'
    });
    iframe.classList.add('youtube-video');
    iframe.src = videoUrl;
    iframe.allowFullscreen = true;

    container.append(controlsContainer, iframe);

    return { container, iframe, prevButton, nextButton, toggleButton, companyDropdown };
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
        const problem = result.leetcodeProblems.questions.find((problem) => problem.title === title);
        if (problem?.videos?.length) {
            let currentVideoIndex = 0;
            const { container, iframe, prevButton, nextButton, toggleButton, companyDropdown } = createVideoContainer(
                problem.videos[currentVideoIndex].embedded_url,
                problem.videos[currentVideoIndex].channel,
                problem.companies || []
            );
            solutionsTab.parentElement?.insertBefore(container, solutionsTab);

            prevButton?.addEventListener('click', () => {
                currentVideoIndex = (currentVideoIndex - 1 + problem.videos.length) % problem.videos.length;
                updateVideo(
                    container,
                    problem.videos[currentVideoIndex].embedded_url,
                    problem.videos[currentVideoIndex].channel,
                    companyDropdown.value
                );
            });

            nextButton?.addEventListener('click', () => {
                currentVideoIndex = (currentVideoIndex + 1) % problem.videos.length;
                updateVideo(
                    container,
                    problem.videos[currentVideoIndex].embedded_url,
                    problem.videos[currentVideoIndex].channel,
                    companyDropdown.value
                );
            });

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
    });
}

function updateVideo(container, videoUrl, channelName, selectedCompany) {
    const iframe = container.querySelector('iframe.youtube-video');
    const channelElement = container.querySelector('div.channel');
    const companyDropdown = container.querySelector('select.Companies');

    if (iframe) iframe.src = videoUrl;
    if (channelElement) channelElement.textContent = channelName;
    if (companyDropdown) companyDropdown.value = selectedCompany;
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
