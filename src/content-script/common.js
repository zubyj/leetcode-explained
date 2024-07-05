function applyButtonTheme(button, isDarkTheme) {
    button.style.backgroundColor = isDarkTheme ? '#333' : '#f9f9f9';
    button.style.color = isDarkTheme ? '#fff' : '#333';

}

// Expose the functions to be accessible by other scripts
window.createStyledElement = createStyledElement;
window.applyButtonTheme = applyButtonTheme;