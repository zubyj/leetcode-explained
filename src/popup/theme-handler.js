// Check localStorage first for faster loading
const isDark = localStorage.getItem('leetcode-explained-theme') === 'dark';

// Set initial theme attribute
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

// Add initial dark theme styles if needed
if (isDark) {
    const style = document.createElement('style');
    style.id = 'preload-dark-theme';
    style.innerHTML = `
        html, body {
            background-color: #202124 !important;
            color: #e8eaed !important;
        }
        pre, code, .response-container {
            background-color: #303134 !important;
            color: #e8eaed !important;
            border-color: #5f6368 !important;
        }
        a {
            color: #8ab4f8 !important;
        }
    `;
    document.head.appendChild(style);
} 