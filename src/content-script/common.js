function applyButtonTheme(button, isDarkTheme) {
    button.style.backgroundColor = isDarkTheme ? '#333' : '#efefef';
    button.style.color = isDarkTheme ? '#fff' : '#333';
    button.onmouseover = () => {
        button.style.color = isDarkTheme ? 'orange' : 'green';
    };
    button.onmouseout = () => {
        button.style.color = isDarkTheme ? '#fff' : '#333';
    };
    document.getElementById('channel')?.style.color = isDarkTheme ? 'lightcyan' : '#333';

}

// Expose the functions to be accessible by other scripts
window.createStyledElement = createStyledElement;
window.applyButtonTheme = applyButtonTheme;