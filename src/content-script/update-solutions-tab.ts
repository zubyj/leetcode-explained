const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

// Utility function to create a styled button
function createStyledButton(text: string, isActive: boolean = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
        button.style.color = isDark ? '#fff' : '#1a1a1a';
        button.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;


        // on hover just make the background a few shades darker or lighter
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = isDark ? '#424242' : '#e6e6e6';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
        });
    });

    button.style.width = '120px';
    button.style.padding = '4px 8px';
    button.style.margin = '0 8px';
    button.style.borderRadius = '6px';
    button.style.fontSize = '11px';
    button.style.transition = 'all 0.2s ease';
    button.style.letterSpacing = '0.5px';
    
    return button;
}

// Function to create the video container
function createVideoContainer(problem: any) {
    const container = createStyledElement('div', {
        position: 'relative',
        display: 'none',
        justifyContent: 'center',
        paddingBottom: `${VIDEO_ASPECT_RATIO}%`,
        marginBottom: '32px',
        transition: 'all 0.3s ease-out',
        borderRadius: '8px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
    });
    container.classList.add('video-container');

    const controlsContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        maxWidth: '800px',
        padding: '16px',
        marginBottom: '32px',
        boxSizing: 'border-box',
        height: '48px',
        borderRadius: '6px',
        zIndex: '1',
    });

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        controlsContainer.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
        controlsContainer.style.color = isDark ? '#fff' : '#1a1a1a';
        controlsContainer.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
    });

    const prevButton = document.createElement('button');
    prevButton.textContent = '⬅️';
    prevButton.style.fontSize = '20px';
    prevButton.style.padding = '8px 16px';
    prevButton.style.border = 'none';
    prevButton.style.backgroundColor = 'transparent';
    prevButton.style.transition = 'all 0.2s ease';
    prevButton.style.cursor = 'pointer';

    const nextButton = document.createElement('button');
    nextButton.textContent = '➡️';
    nextButton.style.fontSize = '20px';
    nextButton.style.padding = '8px 16px';
    nextButton.style.border = 'none';
    nextButton.style.backgroundColor = 'transparent';
    nextButton.style.transition = 'all 0.2s ease';
    nextButton.style.cursor = 'pointer';

    const channelElement = createStyledElement('div', {
        fontSize: '13px',
        letterSpacing: '.5px',
        textAlign: 'center',
        minWidth: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    });

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        // channel element is white on dark mode and black on light mode
        channelElement.style.color = isDark ? '#fff' : '#1a1a1a';
    });

    let currentVideoIndex = 0;
    channelElement.classList.add('channel');
    channelElement.id = 'channel';
    channelElement.textContent = problem.videos[currentVideoIndex].channel;

    prevButton.addEventListener('click', () => {
        currentVideoIndex = (currentVideoIndex - 1 + problem.videos.length) % problem.videos.length;
        updateVideo(iframe, problem.videos[currentVideoIndex].embedded_url);
        channelElement.textContent = problem.videos[currentVideoIndex].channel;
    });

    nextButton.addEventListener('click', () => {
        currentVideoIndex = (currentVideoIndex + 1) % problem.videos.length;
        updateVideo(iframe, problem.videos[currentVideoIndex].embedded_url);
        channelElement.textContent = problem.videos[currentVideoIndex].channel;
    });

    controlsContainer.append(prevButton, channelElement, nextButton);
    container.append(controlsContainer);

    const iframe = createStyledElement('iframe', {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        marginTop: '50px',
    }) as HTMLIFrameElement;

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        iframe.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
    });

    iframe.classList.add('youtube-video');
    iframe.src = problem.videos[0].embedded_url;
    iframe.allowFullscreen = true;

    container.append(iframe);
    return container;
}

function updateVideo(iframe: HTMLIFrameElement, videoUrl: string) {
    iframe.src = videoUrl;
}

function createCodeContainer() {
    const codeElement = document.createElement('pre');
    codeElement.classList.add('code-container');
    codeElement.style.display = 'none';
    codeElement.style.borderRadius = '8px';
    codeElement.style.padding = '16px';
    codeElement.style.marginTop = '24px';
    codeElement.style.width = '95%';
    codeElement.style.fontSize = '14px';
    codeElement.style.marginLeft = '2.5%';
    codeElement.style.maxHeight = '500px';
    codeElement.style.overflowY = 'auto';
    codeElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        codeElement.style.backgroundColor = isDark ? '#2d2d2d' : '#f7f9fa';
        codeElement.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
        codeElement.style.color = isDark ? '#fff' : '#1a1a1a';
    });

    return codeElement;
}

function hideContent() {
    const elements = [
        '.code-container',
        '.language-buttons-container',
        '.video-container'
    ].map(selector => document.querySelector(selector) as HTMLElement);

    elements.forEach(element => {
        if (element) {
            if (element.classList.contains('video-container')) {
                element.style.paddingBottom = '0';
            }
            element.style.display = 'none';
        }
    });
}

function createNavContainer(problem: any) {
    const navContainer = createStyledElement('div', {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
    });
    navContainer.classList.add('nav-container');

    const buttons = [
        { text: 'Discussion', show: true },
        { text: 'Video', show: problem.videos?.length > 0 },
        { text: 'Code', show: problem.languages?.length > 0 }
    ];

    const activeButton = buttons[0];
    buttons.forEach(({ text, show }) => {
        if (!show) return;
        
        const button = createStyledButton(text, text === activeButton.text);
        button.addEventListener('click', () => {
            hideContent();
            if (text === 'Video') {
                const videoContainer = document.querySelector('.video-container') as HTMLElement;
                if (videoContainer) {
                    videoContainer.style.display = 'flex';
                    videoContainer.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
                }
            } else if (text === 'Code') {
                const elements = ['.code-container', '.language-buttons-container']
                    .map(selector => document.querySelector(selector) as HTMLElement);
                elements.forEach(el => el && (el.style.display = 'flex'));
            }
        });
        navContainer.append(button);
    });

    return navContainer;
}

// Convert problem title to GitHub-compatible string
function titleToGitHubFormat(title: string, frontend_id: number): string {
    const formattedTitle = title.toLowerCase().replace(/ /g, "-");
    const idStr = frontend_id.toString().padStart(4, '0');
    return `${idStr}-${formattedTitle}`;
}

// Define the language map type
type SupportedLanguage = 'python' | 'java' | 'javascript' | 'cpp';

// Fetches the solution code from Neetcode's github repo
async function getCodeSolution(title: string, frontend_id: number, language: string): Promise<string | null> {
    // map the language names to their extensions
    const languageMap: Record<SupportedLanguage, string> = {
        'python': 'py',
        'java': 'java',
        'javascript': 'js',
        'cpp': 'cpp',
    };

    // Type guard to check if the language is supported
    if (!isLanguageSupported(language)) {
        console.error('Unsupported language:', language);
        return null;
    }

    // Convert frontend_id and title to the GitHub-compatible format
    const formattedTitle = titleToGitHubFormat(title, frontend_id);
    const filePath = `${language}/${formattedTitle}.${languageMap[language as SupportedLanguage]}`;

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
        return null;
    }
}

// Type guard function to check if a language is supported
function isLanguageSupported(language: string): language is SupportedLanguage {
    return ['python', 'java', 'javascript', 'cpp'].includes(language);
}

function createLanguageButtons(problem: any) {
    const container = createStyledElement('div', {
        paddingTop: '20px',
        marginLeft: '20px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    });
    container.classList.add('language-buttons-container');

    problem.languages.forEach((language: string) => {
        const langButton = document.createElement('button');
        langButton.style.display = 'flex';
        langButton.style.alignItems = 'center';
        langButton.style.gap = '8px';
        langButton.style.padding = '6px 12px';
        langButton.style.borderRadius = '6px';
        langButton.style.fontSize = '11px';
        langButton.style.letterSpacing = '.5px';
        langButton.style.transition = 'all 0.2s ease';
        langButton.style.cursor = 'pointer';

        chrome.storage.local.get(['isDarkTheme'], (result) => {
            const isDark = result.isDarkTheme;
            langButton.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
            langButton.style.color = isDark ? '#fff' : '#1a1a1a';
            langButton.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;

            // on hover just make the background a few shades darker or lighter
            langButton.addEventListener('mouseenter', () => {
                langButton.style.backgroundColor = isDark ? '#424242' : '#e6e6e6';
            });
            langButton.addEventListener('mouseleave', () => {
                langButton.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
            });
        });

        const langIcon = document.createElement('img');
        langIcon.src = chrome.runtime.getURL(`src/assets/images/languages/${language}.svg`);
        langIcon.style.width = '14px';
        langIcon.style.height = '14px';
        langButton.appendChild(langIcon);

        const langName = document.createElement('span');
        langName.textContent = (language === "cpp") ? "C++" : (language.charAt(0).toUpperCase() + language.slice(1));
        langButton.appendChild(langName);

        langButton.addEventListener('click', async () => {
            const code = await getCodeSolution(problem.title, problem.frontend_id, language);
            let codeContainer = document.getElementsByClassName('code-container')[0] as HTMLDivElement;
            if (codeContainer && code) {
                codeContainer.style.display = 'flex';
                codeContainer.textContent = code;
                
                chrome.storage.local.get(['isDarkTheme'], (result) => {
                    const isDark = result.isDarkTheme;
                    codeContainer.style.backgroundColor = isDark ? '#2d2d2d' : '#f7f9fa';
                    codeContainer.style.color = isDark ? '#fff' : '#1a1a1a';
                    codeContainer.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                });

                addCopyIconToElement(codeContainer);
            } else if (codeContainer) {
                codeContainer.style.display = 'flex';
                codeContainer.textContent = 'Code not available';
            }
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
    icon.style.cursor = 'pointer';
    icon.style.marginRight = '20px';
    icon.style.transition = 'all 0.2s ease';

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        icon.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
        
        icon.addEventListener('mouseover', () => {
            icon.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        });
        icon.addEventListener('mouseout', () => {
            icon.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        });
    });

    // On click event if you want to copy something when the icon is clicked
    icon.addEventListener('click', () => {
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

function updateThemeForElement(element: HTMLElement, isDark: boolean) {
    if (!element) return;

    switch (element.className) {
        case 'code-container':
            element.style.backgroundColor = isDark ? '#2d2d2d' : '#f7f9fa';
            element.style.color = isDark ? '#fff' : '#1a1a1a';
            element.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
            break;
        case 'video-container':
            const controls = element.querySelector('div') as HTMLElement;
            if (controls) {
                controls.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
                controls.style.color = isDark ? '#fff' : '#1a1a1a';
                controls.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
            }
            const channelElement = element.querySelector('#channel') as HTMLElement;
            if (channelElement) {
                channelElement.style.color = isDark ? '#fff' : '#1a1a1a';
            }
            const iframe = element.querySelector('iframe') as HTMLElement;
            if (iframe) {
                iframe.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
            }
            break;
        case 'language-buttons-container':
            const buttons = element.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
                button.style.color = isDark ? '#fff' : '#1a1a1a';
                button.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                
                // Remove existing listeners
                const oldMouseEnter = button.onmouseenter;
                const oldMouseLeave = button.onmouseleave;
                if (oldMouseEnter) button.removeEventListener('mouseenter', oldMouseEnter);
                if (oldMouseLeave) button.removeEventListener('mouseleave', oldMouseLeave);
                
                // Add new theme-aware listeners
                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = isDark ? '#424242' : '#e6e6e6';
                    button.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
                    button.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                });
            });
            break;
    }
}

function setupThemeChangeListener() {
    // Listen for our extension's theme changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.isDarkTheme) {
            const isDark = changes.isDarkTheme.newValue;
            updateAllElements(isDark);
        }
    });

    // Listen for LeetCode's theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target instanceof HTMLElement && mutation.target.tagName === 'BODY') {
                chrome.storage.local.get(['themeMode'], (result) => {
                    // Only sync theme if in auto mode
                    if (result.themeMode === 'auto') {
                        const isDark = document.body.classList.contains('dark');
                        // Update our extension's theme setting
                        chrome.storage.local.set({ isDarkTheme: isDark });
                        updateAllElements(isDark);
                    }
                });
            }
        });
    });

    // Start observing the body element for class changes
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

function updateAllElements(isDark: boolean) {
    const elements = [
        '.code-container',
        '.video-container',
        '.language-buttons-container',
        '.nav-container'
    ].map(selector => document.querySelector(selector) as HTMLElement);

    elements.forEach(element => {
        if (element) {
            if (element.classList.contains('nav-container')) {
                // Update nav container buttons
                const buttons = element.querySelectorAll('button');
                buttons.forEach(button => {
                    button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
                    button.style.color = isDark ? '#fff' : '#1a1a1a';
                    button.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                    
                    // Remove existing listeners
                    const oldMouseEnter = button.onmouseenter;
                    const oldMouseLeave = button.onmouseleave;
                    if (oldMouseEnter) button.removeEventListener('mouseenter', oldMouseEnter);
                    if (oldMouseLeave) button.removeEventListener('mouseleave', oldMouseLeave);
                    
                    // Add new theme-aware listeners
                    button.addEventListener('mouseenter', () => {
                        button.style.backgroundColor = isDark ? '#424242' : '#e6e6e6';
                        button.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                    });
                    button.addEventListener('mouseleave', () => {
                        button.style.backgroundColor = isDark ? '#373737' : '#f3f4f5';
                        button.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    });
                });
            } else {
                updateThemeForElement(element, isDark);
            }
        }
    });
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

            // Only create nav container if it doesn't exist or if this is not a video update
            let existingNavContainer = document.querySelector('.nav-container');
            if (!existingNavContainer) {
                const newNavContainer = createNavContainer(problem);
                searchBar?.insertBefore(newNavContainer, searchBar.firstChild);
            }

            // Check if the video container already exists before adding
            if (!document.querySelector('.video-container') && problem.videos.length > 0) {
                let videoContainer = createVideoContainer(problem);
                if (searchBar) searchBar.insertBefore(videoContainer, searchBar.children[1]);
            }

            // Check if the code container already exists before adding
            if (!document.querySelector('.code-container') && problem.languages.length > 0) {
                let codeContainer = createCodeContainer();
                if (searchBar) searchBar.insertBefore(codeContainer, searchBar.children[1]);
            }

            // Check if the language buttons container already exists before adding
            if (!document.querySelector('.language-buttons-container')) {
                let languageButtonsContainer = createLanguageButtons(problem);
                languageButtonsContainer.classList.add('language-buttons-container');
                languageButtonsContainer.style.display = 'none';
                if (searchBar) searchBar.insertBefore(languageButtonsContainer, searchBar.children[1]);  // Or choose a different position
            }

            // Add theme change listener after creating containers
            setupThemeChangeListener();
        });
    }
});