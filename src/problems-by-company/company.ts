const solutions = [] as { id: number, title: string, score: number, url: string }[];

let companyName = 'Amazon';
const companies = [
    'Adobe', 'Apple', 'Bloomberg', 'Cisco', 'Facebook', 'Google', 'Microsoft', 'Spotify'
];

async function main() {
    chrome.storage.local.get('clickedCompany', function (data: { [key: string]: any; }) {
        companyName = data.clickedCompany;
        const title: HTMLElement | null = document.getElementById('title');
        if (title) title.textContent = companyName;
        document.title = companyName + ' Questions';
        addCompanyProblems('Score');
    });

    document.getElementById('#')?.addEventListener('click', () => sortBy('#'));
    document.getElementById('Title')?.addEventListener('click', () => sortBy('Title'));
    document.getElementById('Score')?.addEventListener('click', () => sortBy('Score'));
    document.getElementById('Difficulty')?.addEventListener('click', () => sortBy('Difficulty'));
    document.getElementById('Frequency')?.addEventListener('click', () => sortBy('Frequency'));

    addNavbarLinks();
    await addCompaniesToSelect();
}

function addNavbarLinks() {
    const navbar = document.getElementById('navbar');
    companies.forEach((company) => {
        const button = document.createElement('button');

        button.onclick = () => {
            chrome.storage.local.set({ clickedCompany: company }, () => {
                location.reload();
            });
        };
        button.onmouseover = () => {
            button.style.color = 'orange';
            button.style.cursor = 'pointer';
        };
        button.onmouseout = () => {
            button.style.color = 'white';
        };
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        const icon = document.createElement('img');
        icon.src = `https://logo.clearbit.com/${company.toLowerCase().replace(/\s/g, '')}.com`;
        icon.style.height = '20px';
        icon.style.width = '20px';
        icon.style.marginRight = '20px';
        button.appendChild(icon);

        button.style.color = '#fff';
        button.style.minWidth = '130px';
        button.style.height = '40px';
        button.style.padding = '5px';
        button.style.border = '3px solid #373737';
        button.style.backgroundColor = '#373737';
        button.style.borderRadius = '10px';
        button.style.fontSize = '12px';

        const companyName = document.createTextNode(`${company}`);
        button.appendChild(companyName);
        navbar?.appendChild(button);
    });
}

interface Company {
    name: string;
    score: number;
}

interface Question {
    title: string;
    frontend_id: number;
    companies?: Company[];
}

interface LeetcodeProblems {
    questions: Question[];
}

function addCompanyProblems(sortMethod: string) {
    chrome.storage.local.get('companyProblems', function (data) {
        // Get the problems for the selected company
        const companyProblems = data.companyProblems[companyName];
        console.log('companyProblems', companyProblems);

        // Check if companyProblems is an array before proceeding
        if (Array.isArray(companyProblems)) {
            companyProblems.forEach((problem) => {
                solutions.push({
                    id: problem.id,
                    title: problem.title,
                    // score: company.score, // Adjust this as needed
                    url: `https://leetcode.com/problems/${problem.title.replace(/\s/g, '-')}/`,
                    frequency: problem.freq_alltime,
                    // acceptance: company.acceptance, // Adjust this as needed
                });
            });
        }

        console.log(solutions);

        const table = document.getElementById('solutionTable') as HTMLTableElement;

        if (sortMethod === 'Score') {
            solutions.sort((a, b) => b.score - a.score);
        }

        solutions.forEach(solution => {
            const row = table.insertRow(-1);
            // add id
            row.insertCell(0).innerText = solution.id.toString();
            // add title and link to the problem
            row.insertCell(1).innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;
            // add frequency
            if (solution.frequency) {
                const frequencyCell = row.insertCell(2);
                frequencyCell.innerText = solution.frequency.toString();
                frequencyCell.style.color = 'white';
            }

            // add difficulty
            // const difficultyCell = row.insertCell(1);
            // let innerText = '';
            // if (solution.difficulty === 1) {
            //     innerText = 'Easy';
            // }
            // else if (solution.difficulty === 2) {
            //     innerText = 'Medium';
            // }
            // else if (solution.difficulty === 3) {
            //     innerText = 'Hard';
            // }
            // difficultyCell.innerText = innerText;
            // difficultyCell.style.color = color;


            // add score
            // const scoreCell = row.insertCell(2);
            // scoreCell.innerText = solution.score.toString();

            // add acceptance
            // if (solution.acceptance) {
            //     const acceptanceCell = row.insertCell(5);
            //     acceptanceCell.innerText = solution.acceptance.toString();
            //     acceptanceCell.style.color = color;
            // }

            // add frequency
            // if (solution.frequency) {
            //     const frequencyCell = row.insertCell(4);
            //     frequencyCell.innerText = solution.frequency.toString();
            //     frequencyCell.style.color = color;
            // }
        });
    });
}

async function addCompaniesToSelect() {
    const companySelect = document.getElementById('companySelect') as HTMLSelectElement;

    companySelect.style.backgroundColor = '#373737';
    companySelect.style.color = '#fff';
    companySelect.style.padding = '5px';

    let uniqueCompanies = new Set<string>();

    const data = await new Promise<{ leetcodeProblems: LeetcodeProblems }>(resolve => {
        chrome.storage.local.get('leetcodeProblems', function (items: { [key: string]: any; }) {
            resolve(items as { leetcodeProblems: LeetcodeProblems });
        });
    });

    data.leetcodeProblems.questions.forEach((question: Question) => {
        if (question.companies) {
            question.companies.forEach((company: Company) => {
                uniqueCompanies.add(company.name);
            });
        }
    });

    // Convert the Set to an Array and sort it alphabetically
    const sortedCompanies = Array.from(uniqueCompanies).sort();

    sortedCompanies.forEach((company) => {
        const option = document.createElement('option');
        option.value = company;
        option.text = company;
        if (company === companyName) {
            option.selected = true;
        }
        companySelect.appendChild(option);
    });

    companySelect.addEventListener('change', () => {
        chrome.storage.local.set({ clickedCompany: companySelect.value }, () => {
            location.reload();
        });
    });

    companySelect.style.maxHeight = '500px';
}

function sortBy(column: string) {
    if (column === 'Score') {
        solutions.sort((a, b) => b.score - a.score);
    }
    else if (column === 'Title') {
        solutions.sort((a, b) => a.title.localeCompare(b.title));
    }
    else if (column === 'Difficulty') {
        solutions.sort((a, b) => a.difficulty - b.difficulty); // Easy < Medium < Hard
    }
    else {
        solutions.sort((a, b) => a.id - b.id);
    }

    // after sorting, you might want to re-render your table
    const table = document.getElementById('solutionTable') as HTMLTableElement;

    // remove all existing rows
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    solutions.forEach(solution => {
        const row = table.insertRow(-1);
        row.insertCell(0).innerText = solution.id.toString();
        const titleCell = row.insertCell(1);
        titleCell.innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;
        const scoreCell = row.insertCell(2);
        scoreCell.innerText = solution.score.toString();
        const score = solution.score;
        const color = 'white';
        scoreCell.style.color = color;
        scoreCell.style.fontWeight = 'bold';

        // add difficulty
        const difficultyCell = row.insertCell(3);
        let innerText = '';
        if (solution.difficulty === 1) {
            innerText = 'Easy';
        }
        else if (solution.difficulty === 2) {
            innerText = 'Medium';
        }
        else if (solution.difficulty === 3) {
            innerText = 'Hard';
        }
        difficultyCell.innerText = innerText;
        difficultyCell.style.color = color;

        // add frequency
        if (solution.frequency) {
            const frequencyCell = row.insertCell(4);
            frequencyCell.innerText = solution.frequency.toString();
            frequencyCell.style.color = color;
        }
    });
}

/* Run the script */
main();
