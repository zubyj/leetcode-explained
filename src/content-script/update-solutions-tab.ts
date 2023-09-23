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

function createVideoContainer(problem: any) {
    const container = createStyledElement('div', {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: `${VIDEO_ASPECT_RATIO}%`,
        marginTop: '50px',
        marginBottom: '60px',
        transition: 'padding-bottom 0.3s ease-out',
    });
    container.classList.add('video-container');

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
    let src = problem.videos[0].embedded_url;
    console.log('src', src);
    iframe.src = src;
    iframe.allowFullscreen = true;

    container.append(iframe);
    return container;
}

function hideContent() {
    let solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
    let children = solutionsTab.children;
    for (var child of children) {
        if (!child.classList.contains('nav-container')) {
            child.style.display = 'none';
        }
    }

    // add the nav controls
    let navContainer = document.getElementsByClassName('nav-container')[0] as HTMLDivElement;
    navContainer.style.display = 'flex';

    let videoContainer = document.querySelector('div.video-container') as HTMLDivElement;
    videoContainer.style.paddingBottom = '0%';
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
        borderBottom: '1px solid #fff',
    });

    controlsContainer.classList.add('nav-container');

    // Create discussion button
    const discussionButton = document.createElement('button');
    discussionButton.textContent = 'Discussion';
    discussionButton.style.border = '1px solid white';
    discussionButton.style.padding = '5px';

    // Create solutions button
    const videoButton = document.createElement('button');
    videoButton.textContent = 'Video';
    videoButton.style.border = '1px solid white';
    videoButton.style.padding = '5px';

    // Create code button
    const codeButton = document.createElement('button');
    codeButton.textContent = 'Code';
    codeButton.style.border = '1px solid white';
    codeButton.style.padding = '5px';

    const videoContainer = document.querySelector('div.video-container') as HTMLDivElement;

    discussionButton.addEventListener('click', () => {
        hideContent();
        const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
        let children = solutionsTab.children;
        for (var child of children) {
            let classList = child.classList;
            if (classList.contains('nav-container') || classList.contains('video-container') || classList.contains('code-container')) {
                continue;
            }
            child.style.display = 'block';
        }
    });

    videoButton.addEventListener('click', () => {
        hideContent();
        videoContainer.style.display = 'block';
        videoContainer.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
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
        codeElement.style.paddingTop = '100px';

        // Insert the code element into the solutions tab
        const SOLUTIONS_TAB_INDEX = 0;
        const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[SOLUTIONS_TAB_INDEX];
        // append as second child of solutionstab
        solutionsTab.insertBefore(codeElement, solutionsTab.firstChild);

    } catch (error) {
        console.error('Failed to fetch code:', error);
    }
}

chrome.runtime.onMessage.addListener((request) => {
    const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
    if (request.action === 'updateSolutions') {

        let index = 0
        for (var child of solutionsTab.children) {
            console.log(index, child);
            index++;
        }

        // get all the children of solutions tab
        let children = solutionsTab.children;
        // hide all the children
        for (let i = 0; i < children.length; i++) {
            children[i].style.display = 'none';
        }

        const title = request.title.split('-')[0].trim();
        chrome.storage.local.get(['leetcodeProblems'], (result) => {
            const problem = result.leetcodeProblems.questions.find((problem: { title: string }) => problem.title === title);
            let videoContainer = createVideoContainer(problem);
            if (solutionsTab) {
                console.log('solutionsTab', solutionsTab);
                solutionsTab.insertBefore(videoContainer, solutionsTab.firstChild);

                let navContainer = createNavContainer();
                solutionsTab.insertBefore(navContainer, videoContainer);
            }
            addCodeSolution(problem.title, problem.frontend_id, 'python');
        });
    }
});

