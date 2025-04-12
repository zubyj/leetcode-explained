const VIDEO_ASPECT_RATIO = 56.25; // 16:9 aspect ratio

// Create a wrapper for all our custom content
function createCustomContentWrapper() {
    const wrapper = createStyledElement('div', {
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto 32px auto',
        position: 'relative',
        zIndex: '1'
    });
    wrapper.classList.add('leetcode-explained-wrapper');
    return wrapper;
}

// Utility function to create a styled button
function createStyledButton(text: string, isActive: boolean = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('nav-button');
    if (isActive) button.classList.add('active');

    const updateButtonStyles = (isDark: boolean, isButtonActive: boolean) => {
        // Light theme colors
        const lightTheme = {
            base: '#f3f4f5',
            active: '#e0e0e0',
            hover: '#e6e6e6',
            border: 'rgba(0, 0, 0, 0.15)',
            activeBorder: '#f3f4f5',
            hoverBorder: 'rgba(0, 0, 0, 0.25)',
            text: '#2d2d2d'
        };

        // Dark theme colors
        const darkTheme = {
            base: '#2d2d2d',
            active: '#404040',
            hover: '#3d3d3d',
            border: 'rgba(255, 255, 255, 0.15)',
            activeBorder: '#2d2d2d',
            hoverBorder: 'rgba(255, 255, 255, 0.25)',
            text: '#e6e6e6'
        };

        const theme = isDark ? darkTheme : lightTheme;

        button.style.backgroundColor = isButtonActive ? theme.active : theme.base;
        button.style.color = theme.text;
        button.style.border = `1px solid ${isButtonActive ? theme.activeBorder : theme.border}`;
        button.style.boxShadow = isButtonActive ? `0 0 0 1px ${theme.activeBorder}` : 'none';

        // Remove existing listeners
        const oldMouseEnter = button.onmouseenter;
        const oldMouseLeave = button.onmouseleave;
        if (oldMouseEnter) button.removeEventListener('mouseenter', oldMouseEnter);
        if (oldMouseLeave) button.removeEventListener('mouseleave', oldMouseLeave);

        // Add new theme-aware listeners
        button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('active')) {
                button.style.backgroundColor = theme.hover;
                button.style.borderColor = theme.hoverBorder;
            }
        });

        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active')) {
                button.style.backgroundColor = theme.base;
                button.style.borderColor = theme.border;
            } else {
                button.style.backgroundColor = theme.active;
                button.style.borderColor = theme.activeBorder;
            }
        });
    };

    // Initial style setup
    chrome.storage.local.get(['isDarkTheme'], (result) => {
        updateButtonStyles(result.isDarkTheme, isActive);
    });

    // Listen for theme changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.isDarkTheme) {
            updateButtonStyles(changes.isDarkTheme.newValue, button.classList.contains('active'));
        }
    });

    // Update styles when active state changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                chrome.storage.local.get(['isDarkTheme'], (result) => {
                    updateButtonStyles(result.isDarkTheme, button.classList.contains('active'));
                });
            }
        });
    });

    observer.observe(button, { attributes: true });

    button.style.width = '120px';
    button.style.padding = '4px 8px';
    button.style.margin = '0 8px';
    button.style.borderRadius = '6px';
    button.style.fontSize = '12px';
    button.style.transition = 'all 0.2s ease';
    button.style.letterSpacing = '0.5px';
    button.style.cursor = 'pointer';
    
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
    container.classList.add('video-container', 'content-section');

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
    const container = createStyledElement('div', {
        display: 'none',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative'
    });
    container.classList.add('code-section', 'content-section');

    const codeElement = document.createElement('pre');
    codeElement.classList.add('code-container');
    codeElement.style.display = 'block';
    codeElement.style.borderRadius = '8px';
    codeElement.style.padding = '16px';
    codeElement.style.marginTop = '24px';
    codeElement.style.width = '100%';
    codeElement.style.fontSize = '14px';
    codeElement.style.maxHeight = '500px';
    codeElement.style.overflowY = 'auto';
    codeElement.style.boxSizing = 'border-box';
    codeElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const isDark = result.isDarkTheme;
        codeElement.style.backgroundColor = isDark ? '#2d2d2d' : '#f7f9fa';
        codeElement.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
        codeElement.style.color = isDark ? '#fff' : '#1a1a1a';
    });

    container.appendChild(codeElement);
    return container;
}

function showContent(type: 'Discussion' | 'Video' | 'Code') {
    // Hide all content sections first
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        (section as HTMLElement).style.display = 'none';
    });

    // Get the language buttons container
    const languageButtons = document.querySelector('.language-buttons-container') as HTMLElement;
    if (languageButtons) {
        languageButtons.style.display = 'none'; // Hide by default
    }

    // Show the selected content
    switch (type) {
        case 'Video':
            const videoContainer = document.querySelector('.video-container') as HTMLElement;
            if (videoContainer) {
                videoContainer.style.display = 'flex';
                videoContainer.style.paddingBottom = `${VIDEO_ASPECT_RATIO}%`;
            }
            break;
        case 'Code':
            const codeSection = document.querySelector('.code-section') as HTMLElement;
            if (codeSection) {
                codeSection.style.display = 'block';
                // Only show language buttons when code section is active
                if (languageButtons) {
                    languageButtons.style.display = 'flex';
                }
            }
            break;
        case 'Discussion':
            // No need to do anything as the discussion is the default content
            break;
    }

    // Update button states
    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(button => {
        const isActive = button.textContent === type;
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Show/hide the discussion section
    const discussionSection = document.querySelector('.discuss-markdown') as HTMLElement;
    if (discussionSection) {
        discussionSection.style.display = type === 'Discussion' ? 'block' : 'none';
    }
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

    buttons.forEach(({ text, show }, index) => {
        if (!show) return;
        
        const button = createStyledButton(text, index === 0);
        button.addEventListener('click', () => {
            showContent(text as 'Discussion' | 'Video' | 'Code');
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
        langButton.style.fontSize = '12px';
        langButton.style.letterSpacing = '.5px';
        langButton.style.transition = 'all 0.2s ease';
        langButton.style.cursor = 'pointer';
        langButton.style.fontWeight = '500';

        chrome.storage.local.get(['isDarkTheme'], (result) => {
            const isDark = result.isDarkTheme;
            langButton.style.backgroundColor = isDark ? '#2d2d2d' : '#f3f4f5';
            langButton.style.color = isDark ? '#e6e6e6' : '#2d2d2d';
            langButton.style.border = `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`;

            // on hover just make the background a few shades darker or lighter
            langButton.addEventListener('mouseenter', () => {
                langButton.style.backgroundColor = isDark ? '#3d3d3d' : '#e6e6e6';
                langButton.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
            });
            langButton.addEventListener('mouseleave', () => {
                langButton.style.backgroundColor = isDark ? '#2d2d2d' : '#f3f4f5';
                langButton.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
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
            } else if (element.classList.contains('video-container')) {
                // Update only the controls container and channel element colors
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
            } else {
                updateThemeForElement(element, isDark);
            }
        }
    });
}

// Function to update the solutions tab content
function updateSolutionsTab(title: string) {
    // Check if we're actually on the solutions tab before proceeding
    const isSolutionsPage = /^https:\/\/leetcode\.com\/problems\/.*\/solutions\/?/.test(window.location.href);
    if (!isSolutionsPage) return;

    // Check if we already have content for this problem
    const existingWrapper = document.querySelector('.leetcode-explained-wrapper') as HTMLElement;
    if (existingWrapper) {
        const currentTitle = document.title.split('-')[0].trim();
        const wrapperTitle = existingWrapper.getAttribute('data-problem-title');
        
        // If it's the same problem and the wrapper is in the DOM, preserve state
        if (wrapperTitle === currentTitle && document.contains(existingWrapper)) {
            //console.log('Content exists for current problem, preserving state');
            return;
        }

        // If it's a different problem or wrapper is detached, remove it
        existingWrapper.remove();
    }

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        // Try to find the search bar with retries
        const maxRetries = 10;
        const baseDelay = 300;
        let retryCount = 0;

        const tryInsertContent = () => {
            const searchBar = document.querySelectorAll('input.block')[0]?.parentElement?.parentElement?.parentElement;
            
            if (!searchBar && retryCount < maxRetries) {
                // Use exponential backoff for retry delay
                const delay = baseDelay * Math.pow(1.5, retryCount);
                retryCount++;
                //console.log(`Attempt ${retryCount}: Waiting for search bar element to load... Retrying in ${delay}ms`);
                setTimeout(tryInsertContent, delay);
                return;
            }

            if (!searchBar) {
                //console.log('Failed to find search bar element after all retries');
                
                // If still not found, set up a MutationObserver to watch for DOM changes
                const observer = new MutationObserver((mutations, obs) => {
                    const searchBar = document.querySelectorAll('input.block')[0]?.parentElement?.parentElement?.parentElement;
                    if (searchBar) {
                        obs.disconnect(); // Stop observing once we find the element
                        // Only insert if we don't already have content for this problem
                        const existingWrapper = document.querySelector('.leetcode-explained-wrapper');
                        if (!existingWrapper || !document.contains(existingWrapper)) {
                            insertContent(searchBar, title, result);
                        }
                    }
                });
                
                // Start observing the document with the configured parameters
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                return;
            }

            // Only insert if we don't already have content for this problem
            const existingWrapper = document.querySelector('.leetcode-explained-wrapper');
            if (!existingWrapper || !document.contains(existingWrapper)) {
                insertContent(searchBar, title, result);
            }
        };

        tryInsertContent();
    });
}

// Helper function to insert the content
function insertContent(searchBar: Element, title: string, result: any) {
    const problemTitle = title.split('-')[0].trim();
    const problem = result.leetcodeProblems.questions.find((problem: { title: string }) => problem.title === problemTitle);

    // If no solution code or videos exist, don't do anything
    if (!problem?.videos && !problem?.languages) return;
    if (problem.videos?.length === 0 && problem.languages?.length === 0) return;

    // Create wrapper for all our custom content
    const wrapper = createCustomContentWrapper();
    wrapper.setAttribute('data-problem-title', problemTitle);
    
    // Create and add nav container
    const navContainer = createNavContainer(problem);
    wrapper.appendChild(navContainer);

    // Add video container if videos exist
    if (problem.videos?.length > 0) {
        const videoContainer = createVideoContainer(problem);
        wrapper.appendChild(videoContainer);
    }

    // Add code container and language buttons if languages exist
    if (problem.languages?.length > 0) {
        const codeContainer = createCodeContainer();
        const languageButtonsContainer = createLanguageButtons(problem);
        languageButtonsContainer.classList.add('language-buttons-container');
        languageButtonsContainer.style.display = 'none';
        
        wrapper.appendChild(languageButtonsContainer);
        wrapper.appendChild(codeContainer);
    }

    // Insert the wrapper at the top of the solutions tab
    searchBar.insertBefore(wrapper, searchBar.firstChild);

    // Show discussion by default
    showContent('Discussion');

    // Set up theme change listener
    setupThemeChangeListener();
}

// Self-initialization function that runs when the content script loads
function initializeSolutionsTab() {
    // Function to initialize content
    const initialize = () => {
        // Get the problem title from the page
        const problemTitle = document.title.replace(' - LeetCode', '');
        
        // Only update if we don't have content or if it's detached from DOM
        const existingWrapper = document.querySelector('.leetcode-explained-wrapper');
        if (!existingWrapper || !document.contains(existingWrapper)) {
            updateSolutionsTab(problemTitle);
        }
    };

    // Set up page refresh detection using both URL and history state changes
    let lastUrl = location.href;
    let lastState = history.state;
    
    const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        const currentState = history.state;
        
        // Check if this is a real navigation or just a tab switch
        if (currentUrl !== lastUrl || JSON.stringify(currentState) !== JSON.stringify(lastState)) {
            lastUrl = currentUrl;
            lastState = currentState;
            
            if (currentUrl.includes('/solutions')) {
                initialize();
            }
        }
    });

    // Start observing URL changes
    observer.observe(document, { subtree: true, childList: true });

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
}

// Initialize the content script
initializeSolutionsTab();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateSolutions') {
        updateSolutionsTab(request.title);
    }
});