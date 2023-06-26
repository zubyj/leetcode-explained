chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateDescription') {


        chrome.storage.local.get(['showExamples'], (result) => {
            let showExamples = true;
            showExamples = result.showExamples;
            if (!showExamples) {
                let descriptionContainer = document.querySelector('div._1l1MA');
                if (descriptionContainer) {
                    let exampleElements = descriptionContainer.getElementsByClassName('example');
                    if (exampleElements.length > 0) {
                        let startIndex = Array.from(descriptionContainer.children).indexOf(exampleElements[0].parentNode);
                        for (let i = startIndex; i < descriptionContainer.children.length; i++) {
                            descriptionContainer.children[i].style.display = 'none';
                        }
                    }
                }
            }
            else {
                let descriptionContainer = document.querySelector('div._1l1MA');
                if (descriptionContainer) {
                    let exampleElements = descriptionContainer.getElementsByClassName('example');
                    if (exampleElements.length > 0) {
                        let startIndex = Array.from(descriptionContainer.children).indexOf(exampleElements[0].parentNode);
                        for (let i = startIndex; i < descriptionContainer.children.length; i++) {
                            descriptionContainer.children[i].style.display = 'block';
                        }
                    }
                }
            }
        });

        chrome.storage.local.get(['showCompanyTags'], (result) => {
            let showCompanyTags = true;
            showCompanyTags = !result.showCompanyTags;
            if (showCompanyTags) {
                const title = request.title.split('-')[0].trim();
                addCompanyTags(title);
            }
            else {
                let buttonContainer = document.getElementById('companyButtonContainer');
                if (buttonContainer) {
                    buttonContainer.remove();
                }
            }
        });

        let oldBtn = document.getElementById('openSolutionsBtn');
        if (oldBtn) {
            oldBtn.remove();
        }

        let openSolutionBtn = document.createElement('button');
        openSolutionBtn.id = 'openSolutionsBtn';
        openSolutionBtn.style.minWidth = '100px';
        openSolutionBtn.style.backgroundColor = '#373737';
        openSolutionBtn.style.height = '30px';
        openSolutionBtn.style.fontSize = '10px';
        openSolutionBtn.style.borderRadius = '10px';
        openSolutionBtn.textContent = 'Solution Video';

        openSolutionBtn.onmouseover = function () {
            openSolutionBtn.style.color = 'orange';
        }
        openSolutionBtn.onmouseout = function () {
            openSolutionBtn.style.color = 'white';
        }

        openSolutionBtn.onclick = function () {
            // Get all div elements that contain the text 'Solutions'
            // If a solutions tab was found, simulate a click on it
            let solutionsTabs = document.querySelectorAll('div.relative.flex.h-full.select-none');
            if (solutionsTabs.length > 0) {
                solutionsTabs[2].click();
            } else {
                // If no solutions tab was found, log an error message
                console.log('No solutions tab found');
            }
        };

        function addCompanyTags(title: string) {
            const container = document.querySelectorAll('div.mt-3.flex')[0];

            if (!container) {
                return;
            }

            // Find the old button container or create a new one
            let buttonContainer = document.getElementById('companyButtonContainer');
            if (buttonContainer) {
                // Clear the old content
                buttonContainer.innerHTML = '';
            } else {
                // create a new container for buttons
                buttonContainer = document.createElement('div');
                buttonContainer.id = 'companyButtonContainer';  // add an id
                buttonContainer.style.display = 'flex';
                buttonContainer.style.flexDirection = 'row';
                buttonContainer.style.marginTop = '10px';
                buttonContainer.style.gap = '5px';

                // add the button container to the main container
                container.parentElement?.appendChild(buttonContainer);
            }

            chrome.storage.local.get(['leetcodeProblems'], (result) => {
                const problem = result.leetcodeProblems.questions.find((problem) => problem.title === title);
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
                        buttonContainer.appendChild(button);
                    });
                }
            });
        }
    }
});
