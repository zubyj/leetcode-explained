// shows the examples if the user has enabled it in the settings
function showExamples() {
    chrome.storage.local.get(['showExamples'], (result) => {
        const showExamples = result.showExamples;
        let examples = document.getElementsByClassName('xFUwe')[0];
        if (!examples) return;
        let preTags = examples.getElementsByTagName('pre');
        if (preTags) {
            for (let tag of preTags) {
                tag.style.display = showExamples ? 'block' : 'none';
            }
        }
    });
}

// show the leetcode difficulty if the user has enabled it in the settings
function showDifficulty() {
    chrome.storage.local.get(['showDifficulty'], (result) => {
        const showDifficulty = result.showDifficulty;
        const difficultyContainer = document.querySelectorAll('div.mt-3.flex')[0];
        if (!difficultyContainer) return;
        if (showDifficulty) {
            // hide the first child of the difficulty container
            difficultyContainer.children[0].style.display = 'block';
        }
        else {
            difficultyContainer.children[0].style.display = 'none';
        }
    });
}

// show the leetcode problem rating if the user has enabled it in the settings
function showRating(problemTitle: string) {
    chrome.storage.local.get(['showRating'], (result) => {
        const showRating = result.showRating;
        if (showRating) {
            chrome.storage.local.get(['leetcodeProblems'], (result) => {
                const problem = result.leetcodeProblems.questions.find((problem: problem) => problem.title === problemTitle);

                let ratingElement = document.getElementById('rating');

                if (!problem || !problem.rating) {
                    if (ratingElement) {
                        ratingElement.style.display = 'none';
                        ratingElement.remove();
                    }
                    return;
                }

                if (ratingElement) {
                    // update the existing rating element
                    ratingElement.textContent = problem.rating;
                } else {
                    // create a new rating element
                    ratingElement = document.createElement('div');
                    ratingElement.id = 'rating';
                    ratingElement.textContent = problem.rating;
                    ratingElement.style.fontSize = '12px';
                    ratingElement.style.color = 'lightcyan';
                }

                const difficultyContainer = document.querySelectorAll('div.mt-3.flex')[0];
                if (difficultyContainer) {
                    // insert the rating element after the first child of the difficulty container
                    difficultyContainer.insertBefore(ratingElement, difficultyContainer.children[0].nextSibling);
                }
            });
        }
        else {
            const ratingElement = document.getElementById('rating');
            if (ratingElement) {
                ratingElement.style.display = 'none';
                ratingElement.remove();
            }
        }
    });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateDescription') {
        showExamples();
        showDifficulty();
        showRating(request.title.split('-')[0].trim());
    }
});
