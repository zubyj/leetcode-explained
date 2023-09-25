/*
    Adds the top 5 youtube solution videos into the solutions tab of a Leetcode problem page.
*/

const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio
const SOLUTIONS_TAB_INDEX = 0;

function createStyledElement(tagName: string, styles: { [key: string]: string }) {
    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(styles)) {
        if (typeof element.style[key as any] !== 'undefined') {
            (element.style as any)[key] = value;
        }
    }
    return element;
}

function createStyledButton(text: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.border = '1px solid white';
    button.style.width = '100px';
    button.style.padding = '5px';
    button.style.margin = '0px 20px';
    button.style.borderRadius = '5px';
    button.style.fontSize = '12px';
    // on button hover, change background color
    button.addEventListener('mouseover', () => {
        button.style.color = 'lightgreen';
        button.style.border = '1px solid lightgreen';
    });
    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'transparent';
        button.style.color = 'white';
        button.style.border = '1px solid white';
    });
    return button;
}

function createVideoContainer(problem: any) {
    const container = createStyledElement('div', {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: `${VIDEO_ASPECT_RATIO}%`,
        marginBottom: '60px',
        transition: 'padding-bottom 0.3s ease-out',
    });
    container.classList.add('video-container');

    const iframe = createStyledElement('iframe', {
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        width: '95%',
        height: '95%',
        border: '1px solid grey',
        paddingBottom: '20px',
        marginTop: '50px',
    }) as HTMLIFrameElement;

    iframe.classList.add('youtube-video');
    let src = problem.videos[0].embedded_url;
    console.log('src', src);
    iframe.src = src;
    iframe.allowFullscreen = true;

    const controlsContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        paddingTop: '10px',
        marginBottom: '50px',
        boxSizing: 'border-box',
        color: '#fff',
    });

    const prevButton = document.createElement('button');
    prevButton.textContent = '⬅️';
    prevButton.style.fontSize = '20px';
    const nextButton = document.createElement('button');
    nextButton.textContent = '➡️';
    nextButton.style.fontSize = '20px';

    const channelElement = createStyledElement('div', {
        fontSize: '15px',
        textAlign: 'center',
        width: '200px',
    });
    let currentVideoIndex = 0;
    channelElement.classList.add('channel');
    channelElement.textContent = problem.videos[currentVideoIndex].channel;;
    channelElement.style.fontWeight = '600';
    channelElement.style.color = 'lightcyan';
    channelElement.style.textShadow = '0 0 5px #000000';
    channelElement.style.fontFamily = 'Menlo, Monaco, Consolas, "Courier New", monospace';

    prevButton.addEventListener('click', () => {
        currentVideoIndex = (currentVideoIndex - 1 + problem.videos.length) % problem.videos.length;
        updateVideo(iframe, problem.videos[currentVideoIndex].embedded_url);
        channelElement.textContent = problem.videos[currentVideoIndex].channel; // Update channel name
    });

    nextButton.addEventListener('click', () => {
        currentVideoIndex = (currentVideoIndex + 1) % problem.videos.length;
        updateVideo(iframe, problem.videos[currentVideoIndex].embedded_url);
        channelElement.textContent = problem.videos[currentVideoIndex].channel; // Update channel name
    });


    controlsContainer.append(prevButton, channelElement, nextButton);
    container.append(controlsContainer);
    container.append(iframe);

    return container;
}

function updateVideo(iframe: HTMLIFrameElement, videoUrl: string) {
    iframe.src = videoUrl;
}

function hideContent() {
    let solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
    let children = solutionsTab.children;
    for (var child of children) {
        if (!child.classList.contains('nav-container') &&
            !child.classList.contains('video-container') &&
            !child.classList.contains('code-container')) {
            child.style.display = 'none';
        }
    }

    let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
    if (codeContainer) codeContainer.style.display = 'none';

    let navContainer = document.getElementsByClassName('nav-container')[0] as HTMLDivElement;
    navContainer.style.display = 'flex';

    let videoContainer = document.querySelector('div.video-container') as HTMLDivElement;
    videoContainer.style.paddingBottom = '0%';
    videoContainer.style.display = 'none';
}

function createNavContainer() {
    const controlsContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingTop: '10px',
        boxSizing: 'border-box',
        color: '#fff',
    });

    controlsContainer.classList.add('nav-container');

    // Create the buttons using the utility function
    const discussionButton = createStyledButton('Discussion');
    const videoButton = createStyledButton('Video');
    const codeButton = createStyledButton('Code');

    const videoContainer = document.querySelector('div.video-container') as HTMLDivElement;

    discussionButton.addEventListener('click', () => {
        hideContent();  // First hide everything.
        let solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
        let children = solutionsTab.children;
        for (var child of children) {
            let classList = child.classList;
            if (!classList.contains('nav-container') &&
                !classList.contains('video-container') &&
                !classList.contains('code-container')) {
                child.style.display = 'block';  // Show original discussion content.
            }
        }
    });

    videoButton.addEventListener('click', () => {
        hideContent();
        videoContainer.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
        videoContainer.style.display = 'flex';
    });

    codeButton.addEventListener('click', () => {
        hideContent();
        videoContainer.style.paddingBottom = '0%';
        let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
        codeContainer.style.display = 'flex';
    });

    controlsContainer.append(videoButton)
    controlsContainer.append(codeButton);
    controlsContainer.append(discussionButton);
    return controlsContainer;
}

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
        codeElement.classList.add('code-container');
        codeElement.textContent = code;
        codeElement.style.display = 'none';
        codeElement.style.border = '1px solid grey';
        codeElement.style.paddingLeft = '5px';
        codeElement.style.marginTop = '20px';

        // Insert the code element into the solutions tab
        const SOLUTIONS_TAB_INDEX = 0;
        const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[SOLUTIONS_TAB_INDEX];
        // append as second child of solutionstab
        solutionsTab.appendChild(codeElement);

    } catch (error) {
        console.error('Failed to fetch code:', error);
    }
}

chrome.runtime.onMessage.addListener((request) => {
    const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];

    const searchBar = document.querySelectorAll('div.flex.items-center.justify-between')[1];
    console.log('search bar', searchBar);

    if (request.action === 'updateSolutions') {

        const title = request.title.split('-')[0].trim();
        chrome.storage.local.get(['leetcodeProblems'], (result) => {
            const problem = result.leetcodeProblems.questions.find((problem: { title: string }) => problem.title === title);

            // Check if the video container already exists before adding
            if (!document.querySelector('.video-container')) {
                let videoContainer = createVideoContainer(problem);
                if (solutionsTab) {
                    solutionsTab.insertBefore(videoContainer, solutionsTab.firstChild);
                }
            }

            // Check if the nav container already exists before adding
            if (!document.querySelector('.nav-container')) {
                let navContainer = createNavContainer();
                if (solutionsTab) {
                    let videoContainer = document.querySelector('.video-container');
                    solutionsTab.insertBefore(navContainer, videoContainer);
                }
            }

            // Add code solution (since your addCodeSolution function already checks for the existence of the element, you don't need to check here)
            addCodeSolution(problem.title, problem.frontend_id, 'python');
        });
    }
});


