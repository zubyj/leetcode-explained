
/*
    Adds & hides content from the description tab based on the user's settings
    This includes hiding the company tags, examples, and difficulty of the problem.
*/

// shows the examples if the user has enabled it in the settings
function showExamples() {
    chrome.storage.local.get(['showExamples'], (result) => {
        const showExamples = result.showExamples;
        const descriptionContainer = document.querySelector('div._1l1MA') as Element;
        if (!descriptionContainer) {
            return;
        }
        const examples = descriptionContainer.getElementsByClassName('example');
        if (examples && examples.length > 0) {
            const parent = examples[0].parentNode as Element;
            if (!parent) {
                return;
            }
            const startIndex = Array.from(descriptionContainer.children).indexOf(parent);
            for (let i = startIndex; i < descriptionContainer.children.length; i++) {
                const child = descriptionContainer.children[i] as HTMLElement;
                child.style.display = showExamples ? 'block' : 'none';
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
            companyTagContainer.style.marginTop = '10px';
            companyTagContainer.style.gap = '5px';
            const descriptionBtns = document.querySelectorAll('div.mt-3.flex')[0];
            if (descriptionBtns) {
                descriptionBtns.parentElement?.appendChild(companyTagContainer);
            }
        }

        // Load new tags
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

    const descriptionBtns = document.querySelectorAll('div.mt-3.flex')[0];
    if (!descriptionBtns) {
        return;
    }
    descriptionBtns.parentElement?.appendChild(companyTagContainer);

    interface problem {
        title: string;
        companies: Array<{
            name: string;
            score: number;
        }>;
    }

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem: problem) => problem.title === problemTitle);
        if (problem.companies && problem.companies.length > 0) {
            const topCompanies = problem.companies.slice(0, 5);
            // create a button for each company
            topCompanies.forEach((company: { name: string; score: number; }) => {
                const button = document.createElement('button');
                // opens the company page when the button is clicked
                button.onclick = () => {
                    chrome.runtime.sendMessage({
                        action: 'openCompanyPage', company: company.name,
                    });
                };
                button.onmouseover = () => {
                    button.style.color = 'orange';
                };
                button.onmouseout = () => {
                    button.style.color = 'white';
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

                button.style.color = '#fff';
                button.style.minWidth = '100px';
                button.style.height = '25px';
                button.style.padding = '1px';
                button.style.backgroundColor = '#373737';
                button.style.borderRadius = '10px';
                button.style.fontSize = '10px';

                const companyName = document.createTextNode(`${company.name}`);
                button.appendChild(companyName);

                const score = document.createElement('span');
                score.textContent = ` ${company.score}`;
                score.style.fontSize = '12px';
                score.style.fontWeight = 'bold';
                score.style.fontFamily = 'monospace';
                score.style.marginLeft = '5px';
                button.appendChild(score);
                companyTagContainer.appendChild(button);
            });
        }
    });
    if (descriptionBtns.parentElement) descriptionBtns.parentElement.appendChild(companyTagContainer);
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
