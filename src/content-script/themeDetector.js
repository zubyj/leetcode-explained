// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectTheme') {
        const theme = detectPageTheme();
        console.log(`Detecting theme: ${theme}`);
        sendResponse({ theme });
    }
    if (request.action === 'getTheme') {
        const theme = detectPageTheme();
        console.log(`Getting theme: ${theme}`);
        sendResponse({ theme });
    }
    return true; // Keep the message channel open for asynchronous response
});

// Function to detect the theme of the current LeetCode page
function detectPageTheme() {
    console.log('Starting theme detection on leetcode page...');
    
    // Force a quick check to see if this is a LeetCode page
    const url = window.location.href;
    const isLeetCodePage = url.includes('leetcode.com');
    console.log('Is LeetCode page:', isLeetCodePage, url);
    
    // Method 1: Check for LeetCode's light theme indicator (most reliable)
    // In light mode LeetCode specifically has a white background for these elements
    const mainContent = document.querySelector('.content__1YWu') || 
                         document.querySelector('.problem-description') || 
                         document.querySelector('.content-wrapper');
    
    if (mainContent) {
        const bgColor = window.getComputedStyle(mainContent).backgroundColor;
        console.log('Main content background color:', bgColor);
        
        // LeetCode light mode has white or very light background
        if (bgColor.includes('255, 255, 255') || bgColor.includes('rgb(255, 255, 255)')) {
            console.log('Theme detected from content: LIGHT (white background)');
            return 'light';
        }
    }
    
    // Method 2: Check for LeetCode-specific selectors
    const darkModeSwitcher = document.querySelector('[data-cy="navbar-dark-mode-switcher"]');
    if (darkModeSwitcher) {
        // If the dark mode switcher has a sun icon, it means we're in light mode
        const sunIcon = darkModeSwitcher.querySelector('svg[data-icon="sun"]');
        if (sunIcon) {
            console.log('Theme detected from dark mode switcher: LIGHT (sun icon visible)');
            return 'light';
        }
        // If the dark mode switcher has a moon icon, it means we're in dark mode
        const moonIcon = darkModeSwitcher.querySelector('svg[data-icon="moon"]');
        if (moonIcon) {
            console.log('Theme detected from dark mode switcher: dark (moon icon visible)');
            return 'dark';
        }
    }

    // Method 3: Check HTML tag class for 'dark' or 'light'
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('dark')) {
        console.log('Theme detected from HTML class: dark');
        return 'dark';
    } else if (htmlElement.classList.contains('light')) {
        console.log('Theme detected from HTML class: LIGHT');
        return 'light';
    }

    // Method 4: Check data-theme attribute
    const dataTheme = htmlElement.getAttribute('data-theme');
    if (dataTheme === 'dark') {
        console.log('Theme detected from data-theme: dark');
        return 'dark';
    } else if (dataTheme === 'light') {
        console.log('Theme detected from data-theme: LIGHT');
        return 'light';
    }

    // Method 5: Check header/navbar background color (very reliable for LeetCode)
    const header = document.querySelector('header') || document.querySelector('nav');
    if (header) {
        const headerBgColor = window.getComputedStyle(header).backgroundColor;
        console.log('Header background color:', headerBgColor);
        
        // LeetCode light mode header is usually white or very light
        if (headerBgColor.includes('255, 255, 255') || 
            headerBgColor.includes('rgb(255, 255, 255)') ||
            !isColorDark(headerBgColor)) {
            console.log('Theme detected from header: LIGHT');
            return 'light';
        } else {
            console.log('Theme detected from header: dark');
            return 'dark';
        }
    }

    // Method 6: Check the code editor background (LeetCode specific)
    const codeEditor = document.querySelector('.monaco-editor');
    if (codeEditor) {
        const editorBgColor = window.getComputedStyle(codeEditor).backgroundColor;
        console.log('Code editor background color:', editorBgColor);
        if (isColorDark(editorBgColor)) {
            console.log('Theme detected from code editor: dark');
            return 'dark';
        } else {
            console.log('Theme detected from code editor: LIGHT');
            return 'light';
        }
    }

    // Method 7: Check background color to determine if dark or light
    const backgroundColor = window.getComputedStyle(document.body).backgroundColor;
    console.log('Body background color:', backgroundColor);
    if (isColorDark(backgroundColor)) {
        console.log('Theme detected from body bg: dark');
        return 'dark';
    } else {
        console.log('Theme detected from body bg: LIGHT');
        return 'light';
    }
}

// Helper function to determine if a color is dark based on luminance
function isColorDark(color) {
    // Extract RGB values
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) {
        console.log('Could not extract RGB values from color:', color);
        return true; // Default to dark if can't extract
    }

    // Calculate relative luminance
    const r = parseInt(rgb[0]) / 255;
    const g = parseInt(rgb[1]) / 255;
    const b = parseInt(rgb[2]) / 255;
    
    // Weighted luminance formula (human eye is more sensitive to green)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    console.log(`Color luminance: ${luminance} (< 0.5 is dark)`);
    
    // Return true for dark colors (lower luminance)
    return luminance < 0.5;
} 