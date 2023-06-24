chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'addCompanies') {
        chrome.storage.local.get(['hideDifficulty'], (result) => {
            const canShowDifficulty = !result.hideDifficulty;
            if (canShowDifficulty) {
                let buttonIds = ['div.bg-olive', 'div.bg-yellow', 'div.bg-pink'];

                buttonIds.forEach((id) => {
                    let button = document.querySelectorAll(id)[0];
                    if (button) {
                        button.classList.add('hidden');
                    }
                });
            }
        });

        chrome.storage.local.get(['hideTags'], (result) => {
            let canShowCompanyTags = true;
            canShowCompanyTags = !result.hideTags;
            if (canShowCompanyTags) {
                const title = request.title.split('-')[0].trim();
                addCompanies(title);
            }
        });

        const details = document.querySelectorAll('div.mt-3.flex.space-x-4')[0];

        // if showVideoBtn already exists, remove the old one


        let oldBtn = document.getElementById('showVideoBtn');
        if (oldBtn) {
            oldBtn.remove();
        }

        let showVideoBtn = document.createElement('button');
        showVideoBtn.id = 'showVideoBtn';
        showVideoBtn.style.minWidth = '100px';
        showVideoBtn.style.backgroundColor = '#373737';
        showVideoBtn.style.height = '30px';
        showVideoBtn.style.fontSize = '10px';
        showVideoBtn.style.borderRadius = '10px';
        showVideoBtn.textContent = 'Solution Video';

        showVideoBtn.onmouseover = function () {
            showVideoBtn.style.color = 'orange';
        }
        showVideoBtn.onmouseout = function () {
            showVideoBtn.style.color = 'white';
        }

        showVideoBtn.onclick = function () {
            chrome.runtime.sendMessage({ action: "openSolutionVideo" }, function (response) {
                console.log(response);
            });
        };
        details.appendChild(showVideoBtn);
    }
});

function addCompanies(title: string) {
    const container = document.querySelectorAll('div.mt-3.flex')[0];

    if (!container) {
        console.log("no container");
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
        buttonContainer.style.gap = '10px';

        // add the button container to the main container
        container.parentElement?.appendChild(buttonContainer);
    }

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem) => problem.title === title);
        if (problem.companies && problem.companies.length > 0) {

            // slice the array to get only the first five companies
            const topCompanies = problem.companies.slice(0, 5);

            // create a button for each company
            // ... other code

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
                button.style.minWidth = '130px';
                button.style.height = '25px';
                button.style.padding = '1px';
                button.style.backgroundColor = '#373737';
                button.style.borderRadius = '10px';
                button.style.fontSize = '10px';

                const companyName = document.createTextNode(`${company.name}`);
                button.appendChild(companyName);

                const score = document.createElement('span');
                score.textContent = ` ${company.score} ⭐ `;
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
