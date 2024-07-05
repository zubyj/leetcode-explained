const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

// Utility function to create an HTML element with the given tag name and styles
function createStyledElement(tagName: string, styles: { [key: string]: string }) {
    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(styles)) {
        if (typeof element.style[key as any] !== 'undefined') {
            (element.style as any)[key] = value;
        }
    }
    return element;
}

// Utility function to create a styled button
function createStyledButton(text: string, isActive: boolean = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.border = '2px solid grey';
    button.style.width = '100px';
    button.style.padding = '3px';
    button.style.margin = '0px 20px';
    button.style.borderRadius = '5px';
    if (isActive) button.style.borderColor = 'lightgreen';
    button.style.fontSize = '12px';
    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        applyButtonTheme(button, isDark);

    })

    return button;
}

// Function to create the video container
function createVideoContainer(problem: any) {
    const container = createStyledElement('div', {
        position: 'relative',
        display: 'none',
        justifyContent: 'center',
        paddingBottom: `0px`,
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
        fontSize: '12px',
        textAlign: 'center',
        width: '200px',
    });
    let currentVideoIndex = 0;
    channelElement.classList.add('channel');
    channelElement.id = 'channel';
    channelElement.textContent = problem.videos[currentVideoIndex].channel;;
    channelElement.style.fontWeight = '400';
    chrome.storage.local.get(['isDarkTheme'], (result) => {
        channelElement.style.color = result.isDarkTheme ? 'lightcyan' : '#333';
    })

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

function createCodeContainer() {
    // Create an HTML element to hold the code
    const codeElement = document.createElement('pre');
    codeElement.classList.add('code-container');
    codeElement.style.display = 'none';
    codeElement.style.border = '1px solid grey';
    codeElement.style.paddingLeft = '5px';
    codeElement.style.marginTop = '20px';
    codeElement.style.width = '95%';
    codeElement.style.fontSize = '12px';
    codeElement.style.marginLeft = '2.5%';
    codeElement.style.padding = '10px';
    codeElement.style.maxHeight = '400px';
    codeElement.style.overflowY = 'auto';
    return codeElement;
}

function hideContent() {
    let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
    if (codeContainer) codeContainer.style.display = 'none';
    let languageButtonsContainer = document.getElementsByClassName('language-buttons-container')[0] as HTMLDivElement;
    if (languageButtonsContainer) languageButtonsContainer.style.display = 'none';

    let navContainer = document.getElementsByClassName('nav-container')[0] as HTMLDivElement;
    if (navContainer) navContainer.style.display = 'flex';

    let videoContainer = document.querySelector('div.video-container') as HTMLDivElement;
    if (videoContainer) {
        videoContainer.style.paddingBottom = '0%';
        videoContainer.style.display = 'none';
    }
}


function createNavContainer(problem: any) {

    const navContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingTop: '10px',
        paddingBottom: '20px',
        boxSizing: 'border-box',
        color: '#fff',
    });
    navContainer.classList.add('nav-container');

    // Add discussion button    
    const discussionButton = createStyledButton('Discussion', true);
    const codeButton = createStyledButton('Code');
    const videoButton = createStyledButton('Video');

    discussionButton.addEventListener('click', () => {
        hideContent();
        videoButton.style.borderColor = 'grey';
        discussionButton.style.borderColor = 'lightgreen';
        codeButton.style.borderColor = 'grey';
    });
    navContainer.append(discussionButton);

    if (problem.videos && problem.videos.length > 0) {
        videoButton.addEventListener('click', () => {
            hideContent();
            let videoContainer = document.querySelector('div.video-container') as HTMLDivElement;
            videoContainer.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
            videoContainer.style.display = 'flex';

            videoButton.style.borderColor = 'lightgreen';
            discussionButton.style.borderColor = 'grey';
            codeButton.style.borderColor = 'grey';
        });
        navContainer.append(videoButton);
    }
    if (problem.languages && problem.languages.length > 0) {
        codeButton.addEventListener('click', () => {
            hideContent();
            let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
            codeContainer.style.display = 'flex';
            let languageButtonsContainer = document.getElementsByClassName('language-buttons-container')[0] as HTMLDivElement;
            languageButtonsContainer.classList.add('language-buttons-container');
            languageButtonsContainer.style.display = 'flex';

            codeButton.style.borderColor = 'lightgreen';
            discussionButton.style.borderColor = 'grey';
            videoButton.style.borderColor = 'grey';
        });
        navContainer.append(codeButton);
    }

    return navContainer;
}

// Convert problem title to GitHub-compatible string
function titleToGitHubFormat(title: string, frontend_id: number): string {
    const formattedTitle = title.toLowerCase().replace(/ /g, "-");
    const idStr = frontend_id.toString().padStart(4, '0');
    return `${idStr}-${formattedTitle}`;
}

// Fetches the solution code from Neetcode's github repo
async function getCodeSolution(title: string, frontend_id: number, language: string,) {
    // map the language names to their extensions
    const languageMap = {
        'python': 'py',
        'java': 'java',
        'javascript': 'js',
        'cpp': 'cpp',
    }

    // Convert frontend_id and title to the GitHub-compatible format
    const formattedTitle = titleToGitHubFormat(title, frontend_id);
    const filePath = `${language}/${formattedTitle}.${languageMap[language]}`; // Change 'other_extension' accordingly

    // Construct the URL to fetch the file content from GitHub
    const url = `https://api.github.com/repos/neetcode-gh/leetcode/contents/${filePath}`;

    try {
        // Make the API call to fetch the code from GitHub
        const response = await fetch(url);
        const data = await response.json();

        // Decode the Base64 encoded content
        const code = atob(data.content);
        return code;
    } catch (error) {
        console.error('Failed to fetch code:', error);
    }
}

function createLanguageButtons(problem: any) {
    const container = createStyledElement('div', {
        paddingTop: '20px',
        marginLeft: '20px',
    });

    // For each language, create a button and set up its event listener
    problem.languages.forEach((language: string) => {
        // Create the button using the utility function
        const buttonLabel = (language === "cpp") ? "C++" : (language.charAt(0).toUpperCase() + language.slice(1));
        const langButton = document.createElement('button');
        langButton.style.border = '1px solid grey';
        langButton.style.width = '110px';
        langButton.style.display = 'flex';
        langButton.style.flexDirection = 'row';
        langButton.style.padding = '3px';
        langButton.style.margin = '0px 5px';
        langButton.addEventListener('mouseover', () => {
            langButton.style.borderColor = 'lightgreen';
        });
        langButton.addEventListener('mouseout', () => {
            langButton.style.borderColor = 'grey';
        });

        // Get the icon for the language
        const langIcon = document.createElement('img');
        langIcon.src = chrome.runtime.getURL(`src/assets/images/languages/${language}.svg`);
        langIcon.style.width = '20px';
        langIcon.style.height = '20px';

        langButton.appendChild(langIcon);
        let langName = document.createElement('span');
        langName.textContent = buttonLabel;
        langName.style.fontSize = '12px';
        langName.style.paddingLeft = '15px';
        langButton.appendChild(langName);

        langButton.addEventListener('click', () => {
            let code = getCodeSolution(problem.title, problem.frontend_id, language);
            code.then((code) => {
                let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
                if (codeContainer) {
                    codeContainer.style.display = 'flex';
                    codeContainer.textContent = code;
                    addCopyIconToElement(codeContainer);
                }
            });
        });
        container.append(langButton);
    });
    return container;
}

function addCopyIconToElement(element: HTMLElement) {
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL("src/assets/images/copy-icon.png");
    icon.style.width = '30px';
    icon.style.height = '30px';
    icon.style.padding = '5px';
    icon.style.borderRadius = '5px';
    icon.style.border = '1px solid grey';
    icon.style.cursor = 'pointer';
    icon.style.marginRight = '20px';
    // on hover, change background color
    icon.addEventListener('mouseover', () => {
        icon.style.borderColor = 'lightgreen';
    });
    icon.addEventListener('mouseout', () => {
        icon.style.borderColor = 'grey';
    });

    // On click event if you want to copy something when the icon is clicked
    icon.addEventListener('click', () => {
        // Logic to copy whatever you want to clipboard
        let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
        const textToCopy = codeContainer.textContent || "";
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Change the icon to a checkmark to indicate that the text has been copied
            icon.src = chrome.runtime.getURL("src/assets/images/check-icon.png");
            // After 2 seconds, change the icon back to the copy icon
            setTimeout(() => {
                icon.src = chrome.runtime.getURL("src/assets/images/copy-icon.png");
            }, 1000);
        }).catch(err => {
            console.error("Could not copy text: ", err);
        });
    });

    element.insertBefore(icon, element.firstChild);
}

chrome.runtime.onMessage.addListener((request) => {
    // get discussion tab so we can insert the content before it
    if (request.action === 'updateSolutions') {
        chrome.storage.local.get(['leetcodeProblems'], (result) => {
            const searchBar = document.querySelectorAll('input.block')[0].parentElement?.parentElement?.parentElement;
            const title = request.title.split('-')[0].trim();
            const problem = result.leetcodeProblems.questions.find((problem: { title: string }) => problem.title === title);

            // If no solution code or videos exist, dont do anything.
            if (!problem.videos && !problem.languages) return;
            if (problem.videos.length == 0 && problem.languages.length == 0) {
                return;
            }

            // Check if the nav container already exists before adding
            let existingNavContainer = document.querySelector('.nav-container');
            if (existingNavContainer) {
                existingNavContainer.remove();
            }

            // Create a new nav container (ensure that the 'createNavContainer' function is defined correctly and accessible)
            const newNavContainer = createNavContainer(problem);
            searchBar?.insertBefore(newNavContainer, searchBar.firstChild)

            // Check if the video container already exists before adding
            if (!document.querySelector('.video-container') && problem.videos.length > 0) {
                let videoContainer = createVideoContainer(problem);
                if (searchBar) searchBar.insertBefore(videoContainer, searchBar.children[1]);
            }

            // Check if the code container already exists before adding
            if (!document.querySelector('.code-container') && problem.languages.length > 0) {
                let codeContainer = createCodeContainer();
                if (searchBar) searchBar.insertBefore(codeContainer, searchBar.children[1]);
                // let code = getCodeSolution(problem.title, problem.frontend_id, 'python');
                // code.then((code) => {
                //     let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
                //     if (codeContainer) {
                //         codeContainer.textContent = code;
                //         addCopyIconToElement(codeContainer);
                //     }
                // });
            }

            // Check if the language buttons container already exists before adding
            if (!document.querySelector('.language-buttons-container')) {
                let languageButtonsContainer = createLanguageButtons(problem);
                languageButtonsContainer.classList.add('language-buttons-container');
                languageButtonsContainer.style.display = 'none';
                if (searchBar) searchBar.insertBefore(languageButtonsContainer, searchBar.children[1]);  // Or choose a different position
            }
        });
    }
});