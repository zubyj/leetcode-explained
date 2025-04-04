// Add code to highlight response after it's displayed
document.addEventListener('DOMContentLoaded', function() {
    // Function to make the response visible and highlighted
    function watchForResponseContent() {
        const responseElement = document.getElementById('analyze-code-response');
        if (responseElement) {
            // Create a MutationObserver to detect when content is added
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Make sure the element is visible by removing the 'hidden' class
                        responseElement.classList.remove('hidden');
                    }
                });
            });
            
            // Start observing the response element
            observer.observe(responseElement, { childList: true, subtree: true });
        }
    }
    
    watchForResponseContent();
}); 