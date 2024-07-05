
// shows the examples if the user has enabled it in the settings
function showExamples() {
    chrome.storage.local.get(['showExamples'], (result) => {
        const showExamples = result.showExamples;
        const examples = document.querySelectorAll('div.flex.h-full.w-full')[0];
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
        const difficultyContainer = document.querySelectorAll('div.relative.inline-flex')[0];
        if (!difficultyContainer) return;
        if (showDifficulty) {
            // hide the first child of the difficulty container
            difficultyContainer.style.display = 'block';
        }
        else {
            difficultyContainer.style.display = 'none';
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
                    ratingElement.style.backgroundColor = '#3D3D3C';
                    ratingElement.style.borderRadius = '10px';
                    ratingElement.style.width = '50px';
                    ratingElement.style.textAlign = 'center';
                    ratingElement.style.paddingTop = '2px';
                    ratingElement.style.color = 'lightcyan';
                }

                const difficultyContainer = document.querySelectorAll('div.relative.inline-flex')[0];
                if (difficultyContainer) {
                    // insert the rating element after the first child of the difficulty container
                    let parent = difficultyContainer.parentElement;
                    parent?.insertBefore(ratingElement, parent.firstChild);
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

// show the company tags if the user has enabled it in the settings
function showCompanyTags(problemTitle: string) {
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        const showCompanyTags = result.showCompanyTags;
        let companyTagContainer = document.getElementById('companyTagContainer');

        if (!showCompanyTags) {
            if (companyTagContainer) {
                companyTagContainer.style.display = 'none';
            }
            return;
        }

        if (companyTagContainer) {
            while (companyTagContainer.firstChild) {
                companyTagContainer.firstChild.remove();
            }
        } else {
            companyTagContainer = document.createElement('div');
            companyTagContainer.id = 'companyTagContainer';
            companyTagContainer.style.display = 'flex';
            companyTagContainer.style.flexDirection = 'row';
            companyTagContainer.style.marginBottom = '20px';
            companyTagContainer.style.gap = '5px';

            const description = document.getElementsByClassName('elfjS')[0];
            if (description) {
                description.insertBefore(companyTagContainer, description.firstChild);
            }
        }

        loadCompanyTags(problemTitle, companyTagContainer);
    });
}

// loads and creates company tags for the problem from the local storage
function loadCompanyTags(problemTitle: string, companyTagContainer: HTMLElement) {
    companyTagContainer.id = 'companyTagContainer';
    companyTagContainer.style.display = 'flex';
    companyTagContainer.style.flexDirection = 'row';
    companyTagContainer.style.marginTop = '10px';
    companyTagContainer.style.gap = '5px';

    const description = document.getElementsByClassName('elfjS')[0];

    if (!description) {
        return;
    }

    interface problem {
        title: string;
        companies: Array<{
            name: string;
        }>;
    }

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem: problem) => problem.title === problemTitle);
        if (problem.companies && problem.companies.length > 0) {
            const topCompanies = problem.companies.slice(0, 5);
            // create a button for each company
            topCompanies.forEach((company: { name: string; }) => {
                const button = document.createElement('button');
                // opens the company page when the button is clicked
                button.onclick = () => {
                    chrome.runtime.sendMessage({
                        action: 'openCompanyPage', company: company.name,
                    });
                };

                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';

                const icon = document.createElement('img');
                icon.src = `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s/g, '')}.com`;
                icon.style.height = '12px';
                icon.style.width = '12px';
                icon.style.marginRight = '5px';
                button.appendChild(icon);

                button.style.minWidth = '100px';
                button.style.height = '25px';
                button.style.padding = '1px';
                button.style.borderRadius = '10px';
                button.style.fontSize = '10px';

                chrome.storage.local.get(['isDarkTheme'], (result) => {
                    const isDark = result.isDarkTheme;
                    applyButtonTheme(button, isDark);
                });

                const companyName = document.createTextNode(`${company.name}`);
                button.appendChild(companyName);
                companyTagContainer.appendChild(button);
            });
        }
    });
    if (description) description.insertBefore(companyTagContainer, description.firstChild);
    return companyTagContainer;
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateDescription') {
        showExamples();
        showCompanyTags(request.title.split('-')[0].trim());
        showDifficulty();
        showRating(request.title.split('-')[0].trim());
    }
});
