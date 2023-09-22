/*
    Adds the top 5 youtube solution videos into the solutions tab of a Leetcode problem page.
*/

const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

let discussion;
let solutionVideo;
let solutionCode;

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

function createNavButtons() {
    const navContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        color: '#fff',
        marginTop: '20px',
    });

    const videoButton = createStyledElement('button', {
        'width': '100px',
        'border': '1px solid white',
    });
    videoButton.textContent = 'Solution Video';

    const codeButton = createStyledElement('button', {
        'width': '100px',
        'border': '1px solid white',
    });
    codeButton.textContent = 'Solution Code';

    const discussionButton = createStyledElement('button', {
        'width': '100px',
        'border': '1px solid white',
    });
    discussionButton.textContent = 'Discussion';

    navContainer.append(discussionButton);
    navContainer.append(codeButton);
    navContainer.append(videoButton);


    let solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
    solutionsTab?.insertBefore(navContainer, solutionsTab.firstChild);
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
        console.log(titleToGitHubFormat(problem.title, problem.frontend_id));
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


        chrome.storage.local.get(['leetcodeProblems'], (result) => {
            const problem = result.leetcodeProblems.questions.find((p: { title: string }) => p.title === title);
            if (problem) {
                // Add code solutions for each language you support
                // e.g., 'c', 'python', 'java', etc.
                addCodeSolution(title, problem.frontend_id, 'python');
            }
        });

        createNavButtons();

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


// Convert problem title to GitHub-compatible string
function titleToGitHubFormat(title: string, frontend_id: number): string {
    const formattedTitle = title.toLowerCase().replace(/ /g, "-");
    const idStr = frontend_id.toString().padStart(4, '0');
    return `${idStr}-${formattedTitle}`;
}

// Function to fetch the code from GitHub and insert it into the solutions tab
// (Note: This is a mockup; actual implementation would require making an API request)
async function addCodeSolution(title: string, frontend_id: number, language: string) {
    // Convert frontend_id and title to the GitHub-compatible format
    const formattedTitle = titleToGitHubFormat(title, frontend_id);
    const filePath = `${language}/${formattedTitle}.${language === 'python' ? 'py' : 'py'}`; // Change 'other_extension' accordingly
    console.log('filepath', filePath);


    // Construct the URL to fetch the file content from GitHub
    const url = `https://api.github.com/repos/neetcode-gh/leetcode/contents/${filePath}`;

    try {
        // Make the API call to fetch the code from GitHub
        const response = await fetch(url);
        const data = await response.json();

        // Decode the Base64 encoded content
        const code = atob(data.content);

        // Create an HTML element to hold the code
        const codeElement = document.createElement('pre');
        codeElement.style.width = '95%';
        codeElement.style.minHeight = '200px';
        codeElement.style.border = '1px solid white';
        codeElement.style.marginLeft = '2.5%';
        codeElement.style.padding = '10px';
        codeElement.style.justifyContent = 'center';
        codeElement.style.alignItems = 'center';
        codeElement.textContent = code;

        // Insert the code element into the solutions tab
        const SOLUTIONS_TAB_INDEX = 0;
        const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[SOLUTIONS_TAB_INDEX];
        // solutionsTab?.appendChild(codeElement);
        // insert code element after first child of solutions tab
        const existingContainer = solutionsTab.parentElement?.querySelector('div.video-container');
        if (existingContainer) {
            existingContainer.insertAdjacentElement('afterend', codeElement);
        }

        // solutionsTab?.insertBefore(codeElement, solutionsTab.firstChild);
        // solutionsTab?.insertAdjacentElement('afterbegin', codeElement);
    } catch (error) {
        console.error('Failed to fetch code:', error);
    }
}

