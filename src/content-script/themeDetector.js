// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectTheme') {
        const theme = detectPageTheme();
        sendResponse({ theme });
    }
    return true; // Keep the message channel open for asynchronous response
});

// Function to detect the theme of the current LeetCode page
function detectPageTheme() {
    // Method 1: Check HTML tag class for 'dark' or 'light'
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('dark')) {
        return 'dark';
    } else if (htmlElement.classList.contains('light')) {
        return 'light';
    }

    // Method 2: Check data-theme attribute
    const dataTheme = htmlElement.getAttribute('data-theme');
    if (dataTheme === 'dark') {
        return 'dark';
    } else if (dataTheme === 'light') {
        return 'light';
    }

    // Method 3: Check background color to determine if dark or light
    const backgroundColor = window.getComputedStyle(document.body).backgroundColor;
    if (isColorDark(backgroundColor)) {
        return 'dark';
    }

    // Default to dark if we can't determine
    return 'dark';
}

// Helper function to determine if a color is dark based on luminance
function isColorDark(color) {
    // Extract RGB values
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return true; // Default to dark if can't extract

    // Calculate relative luminance
    const r = parseInt(rgb[0]) / 255;
    const g = parseInt(rgb[1]) / 255;
    const b = parseInt(rgb[2]) / 255;
    
    // Weighted luminance formula (human eye is more sensitive to green)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    // Return true for dark colors (lower luminance)
    return luminance < 0.5;
} 