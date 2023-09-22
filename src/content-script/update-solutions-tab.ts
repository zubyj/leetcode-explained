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

function createNavContainer() {
    const controlsContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        paddingTop: '10px',
        boxSizing: 'border-box',
        color: '#fff',
        marginBottom: '100px',
        borderBottom: '1px solid #fff',
    });

    // Create discussion button
    const discussionButton = document.createElement('button');
    discussionButton.textContent = 'Discussion';
    discussionButton.style.border = '1px solid white';
    discussionButton.style.padding = '5px';

    // Create solutions button
    const solutionsButton = document.createElement('button');
    solutionsButton.textContent = 'Video';
    solutionsButton.style.border = '1px solid white';
    solutionsButton.style.padding = '5px';

    // Create code button
    const codeButton = document.createElement('button');
    codeButton.textContent = 'Code';
    codeButton.style.border = '1px solid white';
    codeButton.style.padding = '5px';


    const videoContainer = document.querySelector('div.video-container') as HTMLDivElement;

    discussionButton.addEventListener('click', () => {
        videoContainer.style.paddingBottom = '0%';
    });

    solutionsButton.addEventListener('click', () => {
        videoContainer.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
    });

    codeButton.addEventListener('click', () => {
        console.log('code button clicked');
    });


    controlsContainer.append(solutionsButton)
    controlsContainer.append(codeButton);
    controlsContainer.append(discussionButton);
    return controlsContainer;
}

chrome.runtime.onMessage.addListener((request) => {
    const solutionsTab = document.querySelectorAll('div.relative.flex.h-full.w-full')[0];
    if (request.action === 'updateSolutions') {
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
        });
    }
});

