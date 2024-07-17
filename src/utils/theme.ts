export function initializeTheme(): void {
    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const theme = result.isDarkTheme ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeUI(theme); // Make sure this function adjusts the UI correctly
    });
}

export function toggleTheme(): void {
    chrome.storage.local.get(['isDarkTheme'], (result) => {
        const currentTheme = result.isDarkTheme ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);

        chrome.storage.local.set({ isDarkTheme: newTheme === 'dark' });

        updateThemeUI(newTheme); // Update UI elements such as buttons or labels
    });
}

function updateThemeUI(theme: string) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (!themeIcon || !themeText) return;
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}