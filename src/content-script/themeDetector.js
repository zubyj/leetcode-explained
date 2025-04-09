// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectTheme' || request.action === 'getTheme') {
        debouncedThemeDetection(sendResponse);
        return true; // Keep the message channel open for asynchronous response
    }
});

// Function to detect the theme of the current LeetCode page
function detectPageTheme() {
    // Force a quick check to see if this is a LeetCode page
    const url = window.location.href;
    const isLeetCodePage = url.includes('leetcode.com');
    
    // Method 1: Check for LeetCode's light theme indicator (most reliable)
    // In light mode LeetCode specifically has a white background for these elements
    const mainContent = document.querySelector('.content__1YWu') || 
                         document.querySelector('.problem-description') || 
                         document.querySelector('.content-wrapper');
    
    if (mainContent) {
        const bgColor = window.getComputedStyle(mainContent).backgroundColor;
        
        // LeetCode light mode has white or very light background
        if (bgColor.includes('255, 255, 255') || bgColor.includes('rgb(255, 255, 255)')) {
            return 'light';
        }
    }
    
    // Method 2: Check for LeetCode-specific selectors
    const darkModeSwitcher = document.querySelector('[data-cy="navbar-dark-mode-switcher"]');
    if (darkModeSwitcher) {
        // If the dark mode switcher has a sun icon, it means we're in light mode
        const sunIcon = darkModeSwitcher.querySelector('svg[data-icon="sun"]');
        if (sunIcon) {
            return 'light';
        }
        // If the dark mode switcher has a moon icon, it means we're in dark mode
        const moonIcon = darkModeSwitcher.querySelector('svg[data-icon="moon"]');
        if (moonIcon) {
            return 'dark';
        }
    }

    // Method 3: Check HTML tag class for 'dark' or 'light'
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('dark')) {
        return 'dark';
    } else if (htmlElement.classList.contains('light')) {
        return 'light';
    }

    // Method 4: Check data-theme attribute
    const dataTheme = htmlElement.getAttribute('data-theme');
    if (dataTheme === 'dark') {
        return 'dark';
    } else if (dataTheme === 'light') {
        return 'light';
    }

    // Method 5: Check header/navbar background color (very reliable for LeetCode)
    const header = document.querySelector('header') || document.querySelector('nav');
    if (header) {
        const headerBgColor = window.getComputedStyle(header).backgroundColor;
        
        // LeetCode light mode header is usually white or very light
        if (headerBgColor.includes('255, 255, 255') || 
            headerBgColor.includes('rgb(255, 255, 255)') ||
            !isColorDark(headerBgColor)) {
            return 'light';
        } else {
            return 'dark';
        }
    }

    // Default to dark if can't detect
    return 'dark';
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

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Store last detected theme to prevent unnecessary updates
let lastDetectedTheme = null;

// Debounced theme detection function
const debouncedThemeDetection = debounce((sendResponse) => {
    const theme = detectPageTheme();
    if (theme !== lastDetectedTheme) {
        lastDetectedTheme = theme;
        if (sendResponse) {
            sendResponse({ theme });
        }
    }
}, 500); 