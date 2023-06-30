
// shows the Leetcode examples if the user has enabled it in the settings
function showExamples() {
    chrome.storage.local.get(['showExamples'], (result) => {
        let showExamples = result.showExamples;
        let descriptionContainer = document.querySelector('div._1l1MA') as Element;
        if (!descriptionContainer) {
            return;
        }
        let examples = descriptionContainer.getElementsByClassName('example');
        if (examples && examples.length > 0) {
            let parent = examples[0].parentNode as Element;
            if (!parent) {
                return;
            }
            let startIndex = Array.from(descriptionContainer.children).indexOf(parent);
            for (let i = startIndex; i < descriptionContainer.children.length; i++) {
                let child = descriptionContainer.children[i] as HTMLElement;
                child.style.display = showExamples ? 'block' : 'none';
            }
        }
    });
}

function showDifficulty() {
    chrome.storage.local.get(['showDifficulty'], (result) => {
        let showDifficulty = result.showDifficulty;
        let difficultyContainer = document.querySelectorAll('div.bg-olive')[0];
        difficultyContainer.style.display = showDifficulty ? 'block' : 'none';
    });
}

function showCompanyTags(problemTitle: string) {
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        let showCompanyTags = result.showCompanyTags;
        let companyTagContainer = document.getElementById('companyTagContainer');

        if (!showCompanyTags) {
            if (companyTagContainer) {
                companyTagContainer.style.display = 'none';
            }
            return;
        }

        // Always re-load company tags, regardless if container already exists
        if (companyTagContainer) {
            // Remove old tags
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

function loadCompanyTags(problemTitle: string, companyTagContainer: HTMLElement) {
    // create a new container for buttons
    companyTagContainer.id = 'companyTagContainer';  // add an id
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
            // slice the array to get only the first five companies
            const topCompanies = problem.companies.slice(0, 5);

            // create a button for each company
            topCompanies.forEach((company: { name: string; score: any; }) => {
                const button = document.createElement('button');
                button.style.display = 'flex';
                button.style.alignItems = 'center';  // align items vertically in the center
                button.style.justifyContent = 'center';  // align items horizontally in the center

                const icon = document.createElement('img');
                icon.src = `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s/g, '')}.com`; // replace spaces with nothing
                icon.style.height = '12px';
                icon.style.width = '12px';
                icon.style.marginRight = '5px';  // some space between the icon and the name
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
                score.style.marginLeft = '5px';  // some space between the name and the score
                button.appendChild(score);
                companyTagContainer!.appendChild(button);
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
    }
});
