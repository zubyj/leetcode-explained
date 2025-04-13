const allSolutions = [] as { id: number, rank: number, title: string, difficulty: string, url: string, acceptance: string }[];
const solutions = [] as { id: number, rank: number, title: string, difficulty: string, url: string, acceptance: string }[];
let companyName = 'Amazon';
const companies: string[] = [
    'Amazon', 'Apple', 'Facebook', 'Google', 'Microsoft',
];

async function main() {
    chrome.storage.local.get('clickedCompany', function (data: { [key: string]: any; }) {
        companyName = data.clickedCompany;
        const title: HTMLElement | null = document.getElementById('title');
        if (title) title.textContent = 'Top 50 ' + companyName + ' Questions';
        document.title = companyName + ' Questions';
        addCompanyProblems('#'); // Change this line to sort by frequency by default
    });

    document.getElementById('#')?.addEventListener('click', () => sortBy('#'));
    document.getElementById('Difficulty')?.addEventListener('click', () => sortBy('Difficulty'));
    document.getElementById('Rank')?.addEventListener('click', () => sortBy('Rank'));
    document.getElementById('Title')?.addEventListener('click', () => sortBy('Title'));
    document.getElementById('Acceptance')?.addEventListener('click', () => sortBy('Acceptance'));

    addNavbarLinks();
    await addCompaniesToSelect();
}

function addNavbarLinks() {
    const navbar = document.getElementById('navbar');
    companies.forEach((company) => {
        const button = document.createElement('button') as HTMLElement;

        button.onclick = () => {
            chrome.storage.local.set({ clickedCompany: company }, () => {
                location.reload();
            });
        };
        button.onmouseover = () => {
            button.style.backgroundColor = '#404040';
            button.style.cursor = 'pointer';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = '#373737';
            button.style.color = '#fff';
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
        button.style.backgroundColor = '#373737';
        button.style.borderRadius = '10px';
        button.style.fontSize = '12px';
        button.style.margin = '0 10px';

        const companyName = document.createTextNode(`${company}`);
        button.appendChild(companyName);
        navbar?.appendChild(button);
    });
}

interface Company {
    name: string;
}

interface Question {
    title: string;
    frontend_id: number;
    companies?: Company[];
    difficulty_lvl?: string;  // Make sure to define this
    acceptance?: string;  // Same for acceptance
}

interface LeetcodeProblems {
    questions: Question[];
}

function addCompanyProblems(sortMethod: string) {
    chrome.storage.local.get(['companyProblems', 'leetcodeProblems'], function (data) {
        const companyProblems = data.companyProblems[companyName];
        const leetcodeProblems = data.leetcodeProblems.questions;

        if (Array.isArray(companyProblems)) {
            companyProblems.forEach((problem) => {
                const correspondingLeetcodeProblem = leetcodeProblems.find((q: Question) => q.frontend_id === problem.id);
                allSolutions.push({
                    id: problem.id,
                    rank: problem.rank,
                    title: problem.title,
                    url: `https://leetcode.com/problems/${problem.title.replace(/\s/g, '-')}/`,
                    difficulty: correspondingLeetcodeProblem ? String(correspondingLeetcodeProblem.difficulty_lvl) : 'N/A',
                    acceptance: correspondingLeetcodeProblem ? String(correspondingLeetcodeProblem.acceptance) : 'N/A',
                });
            });
        }

        solutions.length = 0;
        solutions.push(...allSolutions);
        rebuildTable();
    });
}

function rebuildTable() {
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    solutions.forEach((solution) => {
        const row = table.insertRow(-1);
        row.insertCell(0).innerText = solution.id.toString();

        const difficulty = solution.difficulty;
        const difficultyCell = row.insertCell(1);
        let difficultyText = '';
        let color = '';

        if (difficulty === '1') {
            difficultyText = 'Easy';
            color = 'lightgreen';
        } else if (difficulty === '2') {
            difficultyText = 'Medium';
            color = 'orange';
        } else if (difficulty === '3') {
            difficultyText = 'Hard';
            color = 'red';
        }

        difficultyCell.innerText = difficultyText || 'N/A';
        difficultyCell.style.color = color;
        difficultyCell.style.fontWeight = 'bold';
        difficultyCell.style.fontSize = '12px';
        difficultyCell.style.borderRadius = '5px';

        row.insertCell(2).innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;

        const acceptanceCell = row.insertCell(3);
        const acceptanceRate = solution.acceptance ? (parseFloat(solution.acceptance) * 100).toFixed(2) : 'N/A';
        acceptanceCell.setAttribute('data-acceptance', acceptanceRate.toString());
        acceptanceCell.style.fontSize = '12px';

        const rankCell = row.insertCell(4);
        rankCell.innerText = solution.rank.toString();
    });
}

async function addCompaniesToSelect() {
    const companySearch = document.getElementById('companySearch') as HTMLInputElement;
    const companyList = document.getElementById('companyList') as HTMLDataListElement;
    let companies: string[] = [];

    // Define the type explicitly
    const data = await new Promise<{ companyProblems: { [key: string]: any } }>((resolve) => {
        chrome.storage.local.get('companyProblems', function (data) {
            resolve({ companyProblems: data.companyProblems });
        });
    });

    const companyProblems = data.companyProblems;
    Object.keys(companyProblems).forEach((company) => {
        if (company) {
            companies.push(company);
        }
    });

    const handleSelection = () => {
        const inputValue = companySearch.value;
        const selectedCompany = companies.find(
            (company) => company.toLowerCase() === inputValue.toLowerCase()
        );
        if (selectedCompany) {
            chrome.storage.local.set({ clickedCompany: selectedCompany }, () => {
                location.reload();
            });
        }
    };

    companySearch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleSelection();
        }
    });

    companySearch.addEventListener('change', handleSelection);

    const sortedCompanies = companies.sort();

    sortedCompanies.forEach((company) => {
        const option = document.createElement('option');
        option.value = company;
        companyList.appendChild(option);
    });
}


const sortOrders: { [key: string]: boolean } = {
    '#': false,
    'Difficulty': false,
    'Title': false,
    'Acceptance': false,
    'Rank': false,
};

function sortBy(column: string) {
    sortOrders[column] = !sortOrders[column];
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    switch (column) {
        case '#':
            solutions.sort((a, b) => (sortOrders[column] ? a.id - b.id : b.id - a.id));
            break;
        case 'Difficulty':
            solutions.sort((a, b) => (sortOrders[column] ? a.difficulty.localeCompare(b.difficulty) : b.difficulty.localeCompare(a.difficulty)));
            break;
        case 'Rank':
            solutions.sort((a, b) => (sortOrders[column] ? a.rank - b.rank : b.rank - a.rank));
            break;
        case 'Title':
            solutions.sort((a, b) => (sortOrders[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
            break;
        case 'Acceptance':
            solutions.sort((a, b) => (sortOrders[column] ? parseFloat(a.acceptance) - parseFloat(b.acceptance) : parseFloat(b.acceptance) - parseFloat(a.acceptance)));
            break;
    }

    rebuildTable();
}

main();
