/*
    Adds the top 5 youtube solution videos into the solutions tab of a Leetcode problem page.
*/

const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

function createStyledElement(tagName: string, styles: { [key: string]: string }) {
    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(styles)) {
        if (typeof element.style[key as any] !== 'undefined') {
            (element.style as any)[key] = value;
        }
    }
    return element;
}

function createButton(content: string, className: string, styles = {}) {
    const button = createStyledElement('button', styles);
    button.textContent = content;
    button.classList.add(className);
    return button;
}

function createControlsContainer(channelName: string) {
    const controlsContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        paddingTop: '10px',
        boxSizing: 'border-box',
        color: '#fff',
    });

    const prevButton = createButton('⬅️', 'prev-video', { fontSize: '20px' });
    const channelElement = createStyledElement('div', {
        fontSize: '15px',
        textAlign: 'center',
        width: '200px',
    });
    channelElement.classList.add('channel');
    channelElement.textContent = channelName;
    channelElement.style.fontWeight = '600';
    channelElement.style.color = 'lightcyan';
    channelElement.style.textShadow = '0 0 5px #000000';
    channelElement.style.fontFamily = 'Menlo, Monaco, Consolas, "Courier New", monospace';
    const nextButton = createButton('➡️', 'next-video', { fontSize: '20px' });

    const toggleButtonStyles = {
        marginLeft: '40px',
        backgroundColor: '#373737',
        border: '1px solid #111111',
        borderRadius: '5px',
        padding: '5px 10px',
    };
    const toggleButton = createButton('🔼', 'toggle-video', toggleButtonStyles);
    controlsContainer.append(prevButton, channelElement, nextButton, toggleButton);
    return { controlsContainer, prevButton, nextButton, toggleButton };
}

function createVideoContainer(videoUrl: string, channelName: string) {
    const container = createStyledElement('div', {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: `${VIDEO_ASPECT_RATIO}%`,
        marginBottom: '60px',
        transition: 'padding-bottom 0.3s ease-out',
    });
    container.classList.add('video-container');

    const { controlsContainer, prevButton, nextButton, toggleButton } = createControlsContainer(channelName);

    const iframe = createStyledElement('iframe', {
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        top: '60px',
        width: '95%',
        height: '95%',
        border: '1px solid grey',
    }) as HTMLIFrameElement;
    iframe.classList.add('youtube-video');
    iframe.src = videoUrl;
    iframe.allowFullscreen = true;

    container.append(controlsContainer, iframe);

    return { container, iframe, prevButton, nextButton, toggleButton };
}

// Injects the embedded YouTube solution into the solutions tab of the LeetCode problem.
function addVideo(title: string) {
    const SOLUTIONS_TAB_INDEX = 0;
    const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[SOLUTIONS_TAB_INDEX];
    if (!solutionsTab) return;

    const existingContainer = solutionsTab.parentElement?.querySelector('div.video-container');
    if (existingContainer) return;

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem: { title: string }) => problem.title === title);
        if (problem?.videos?.length) {
            let currentVideoIndex = 0;
            const { container, prevButton, nextButton, toggleButton } = createVideoContainer(
                problem.videos[currentVideoIndex].embedded_url,
                problem.videos[currentVideoIndex].channel,
            );
            const firstChild = solutionsTab.firstChild; // Get the first child of solutionsTab
            solutionsTab.insertBefore(container, firstChild); // Insert the container before the first child

            prevButton?.addEventListener('click', () => {
                currentVideoIndex = (currentVideoIndex - 1 + problem.videos.length) % problem.videos.length;
                updateVideo(
                    container as HTMLDivElement,
                    problem.videos[currentVideoIndex].embedded_url,
                    problem.videos[currentVideoIndex].channel,
                );
            });

            nextButton?.addEventListener('click', () => {
                currentVideoIndex = (currentVideoIndex + 1) % problem.videos.length;
                updateVideo(
                    container as HTMLDivElement,
                    problem.videos[currentVideoIndex].embedded_url,
                    problem.videos[currentVideoIndex].channel,
                );
            });

            toggleButton?.addEventListener('click', () => {
                const videoContainer = document.querySelector('div.video-container') as HTMLDivElement;
                if (videoContainer) {
                    videoContainer.style.paddingBottom = videoContainer.style.paddingBottom === '0%' ? `${VIDEO_ASPECT_RATIO}% ` : '0%';
                    if (videoContainer.style.paddingBottom === '0%') {
                        toggleButton.style.transform = 'rotate(180deg)';
                    } else {
                        toggleButton.style.transform = 'rotate(0deg)';
                    }
                    toggleButton.style.transition = 'transform 0.3s linear';
                }
            });

            // on hover, change background color of toggleButton
            toggleButton?.addEventListener('mouseover', () => {
                toggleButton.style.backgroundColor = '#222';
                toggleButton.style.color = '#000';
            });

            toggleButton?.addEventListener('mouseout', () => {
                toggleButton.style.backgroundColor = 'transparent';
                toggleButton.style.color = '#fff';
            });
        }
    });
}

function updateVideo(container: HTMLDivElement, videoUrl: string, channelName: string) {
    const iframe = container.querySelector('iframe.youtube-video') as HTMLIFrameElement;
    const channelElement = container.querySelector('div.channel');

    if (iframe) iframe.src = videoUrl;
    if (channelElement) {
        channelElement.textContent = channelName;
    }
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'addVideo') {
        const title = request.title.split('-')[0].trim();
        addVideo(title);
    }
});

/**
 * Prevents the iframe from freezing when it's being resized while the mouse is hovering over it.
 */
window.addEventListener('mousedown', () => {
    const iframe = document.querySelector('iframe.youtube-video') as HTMLIFrameElement;
    if (iframe) {
        iframe.style.pointerEvents = 'none';
    }
});

window.addEventListener('mouseup', () => {
    const iframe = document.querySelector('iframe.youtube-video') as HTMLIFrameElement;
    if (iframe) {
        iframe.style.pointerEvents = 'auto';
    }
});
