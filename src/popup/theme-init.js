// Runs before first paint so the popup opens in the right theme with no flash.
const savedTheme = localStorage.getItem('leetcode-explained-theme');
document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');
