// Enable smooth transitions after initial rendering
window.addEventListener('load', function() {
    // Short delay to ensure everything is rendered first
    setTimeout(function() {
        // Remove the inline style forcing no transitions
        const style = document.createElement('style');
        style.innerHTML = '* { transition: color 0.3s, background-color 0.3s, border-color 0.3s !important; }';
        document.head.appendChild(style);
    }, 100);
}); 