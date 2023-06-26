
// shows the Leetcode examples if the user has enabled it in the settings
function showExamples() {
    chrome.storage.local.get(['showExamples'], (result) => {
        let showExamples = result.showExamples;
        let descriptionContainer = document.querySelector('div._1l1MA');
        if (!descriptionContainer) {
            return;
        }
        let exampleElements = descriptionContainer.getElementsByClassName('example');
        if (exampleElements && exampleElements.length > 0) {
            let startIndex = Array.from(descriptionContainer.children).indexOf(exampleElements[0].parentNode);
            for (let i = startIndex; i < descriptionContainer.children.length; i++) {
                descriptionContainer.children[i].style.display = showExamples ? 'block' : 'none';
            }
        }
    });
}

function loadCompanyTags() {
    let companyTags;
    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem) => problem.title === problemTitle);
        if (problem.companies && problem.companies.length > 0) {
            // slice the array to get only the first five companies
            const topCompanies = problem.companies.slice(0, 5);

            // create a button for each company
            topCompanies.forEach(company => {
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
}

// shows the company tags if the user has enabled it in the settings
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
        const descriptionBtns = document.querySelectorAll('div.mt-3.flex')[0];
        if (!descriptionBtns) {
            return;
        }

        // if the company tag container already exists then just show it
        if (companyTagContainer) {
            companyTagContainer.style.display = 'flex';
            return;
        }

        // create a new container for buttons
        companyTagContainer = document.createElement('div');
        companyTagContainer.id = 'companyTagContainer';  // add an id
        companyTagContainer.style.display = 'flex';
        companyTagContainer.style.flexDirection = 'row';
        companyTagContainer.style.marginTop = '10px';
        companyTagContainer.style.gap = '5px';
        descriptionBtns.parentElement?.appendChild(companyTagContainer);

        chrome.storage.local.get(['leetcodeProblems'], (result) => {
            const problem = result.leetcodeProblems.questions.find((problem) => problem.title === problemTitle);
            if (problem.companies && problem.companies.length > 0) {
                // slice the array to get only the first five companies
                const topCompanies = problem.companies.slice(0, 5);

                // create a button for each company
                topCompanies.forEach(company => {
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
    });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateDescription') {
        showExamples();
        showCompanyTags(request.title.split('-')[0].trim());
    }
});
