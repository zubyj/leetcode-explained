chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'addCompanies') {
        const title = request.title.split('-')[0].trim();
        addCompanies(title);
    }
});

function addCompanies(title: string) {
    const container = document.querySelectorAll('div.mt-3.flex')[0];

    if (!container) {
        console.log("no container");
        return;
    }

    // remove the old button container if it exists
    const oldButtonContainer = document.getElementById('companyButtonContainer');
    if (oldButtonContainer) {
        oldButtonContainer.parentNode.removeChild(oldButtonContainer);
    }

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem) => problem.title === title);
        if (problem.companies && problem.companies.length > 0) {

            // create a container for buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.id = 'companyButtonContainer';  // add an id
            buttonContainer.style.display = 'flex';
            buttonContainer.style.flexDirection = 'row';
            buttonContainer.style.marginTop = '10px';
            buttonContainer.style.gap = '10px';

            // slice the array to get only the first five companies
            const topCompanies = problem.companies.slice(0, 5);

            // create a button for each company
            topCompanies.forEach(company => {
                const button = document.createElement('button');
                button.style.color = '#fff';
                button.style.width = '100px';
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
                button.appendChild(score);
                buttonContainer.appendChild(button);
            });

            // add the button container to the main container
            container.parentElement?.appendChild(buttonContainer);
        }
    });
}
