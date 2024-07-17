const allSolutions = [] as { id: number, rank: number, title: string, difficulty: string, url: string, acceptance: string }[];
const solutions = [] as { id: number, rank: number, title: string, difficulty: string, url: string, acceptance: string }[];
let companyName = 'Amazon';
const companies = [
    'Amazon', 'Apple', 'Facebook', 'Google', 'Microsoft',
];

async function main() {

    // 
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
}

interface LeetcodeProblems {
    questions: Question[];
}

function addCompanyProblems(sortMethod: string) {
    chrome.storage.local.get(['companyProblems', 'leetcodeProblems'], function (data) {
        const companyProblems = data.companyProblems[companyName];
        const leetcodeProblems = data.leetcodeProblems.questions;

        // Check if companyProblems is an array before proceeding
        if (Array.isArray(companyProblems)) {
            companyProblems.forEach((problem) => {
                const correspondingLeetcodeProblem = leetcodeProblems.find(q => q.frontend_id === problem.id); // Find the corresponding problem
                // Populate allSolutions instead of solutions
                allSolutions.push({
                    id: problem.id,
                    rank: problem.rank,
                    title: problem.title,
                    url: `https://leetcode.com/problems/${problem.title.replace(/\s/g, '-')}/`,
                    difficulty: correspondingLeetcodeProblem?.difficulty_lvl, // Use the defined variable
                    acceptance: correspondingLeetcodeProblem?.acceptance, // Use the defined variable
                });
            });
        }

        // Initialize solutions with all problems initially
        solutions.length = 0;
        solutions.push(...allSolutions);

        // Rebuild the table with sorted solutions
        rebuildTable();
    });
}


// Function to rebuild the table with sorted solutions
function rebuildTable() {
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    solutions.forEach((solution) => {
        const row = table.insertRow(-1);

        // Add problem id
        row.insertCell(0).innerText = solution.id.toString();

        // Add problem difficulty
        const difficulty = solution.difficulty;
        const difficultyCell = row.insertCell(1);
        let difficultyText = '';
        let color = '';

        if (difficulty === 1) {
            difficultyText = 'Easy';
            color = 'lightgreen';
        } else if (difficulty === 2) {
            difficultyText = 'Medium';
            color = 'orange';
        } else {
            difficultyText = 'Hard';
            color = 'red';
        }

        difficultyCell.innerText = difficultyText || 'N/A';
        difficultyCell.style.color = color;
        difficultyCell.style.fontWeight = 'bold';
        difficultyCell.style.fontSize = '12px';
        difficultyCell.style.borderRadius = '5px'; // Apply border radius

        // Add problem title
        row.insertCell(2).innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;

        // Add acceptance rating
        const acceptanceCell = row.insertCell(3);
        acceptanceCell.innerText = (solution.acceptance ? (solution.acceptance * 100).toFixed(2) + '%' : 'N/A'); // New column for acceptance
        acceptanceCell.style.fontSize = '12px';

        // Add problem rank
        const rankCell = row.insertCell(4);
        rankCell.innerText = solution.rank.toString();
    });
}

async function addCompaniesToSelect() {
    const companySearch = document.getElementById('companySearch') as HTMLInputElement;
    const companyList = document.getElementById('companyList') as HTMLDataListElement;
    let companies = [];

    const data = await new Promise<{ companyProblems: any }>((resolve) => {
        chrome.storage.local.get('companyProblems', function (data) {
            resolve(data);
        });
    });

    const companyProblems = data.companyProblems;
    // Add all the keys to the set
    Object.keys(companyProblems).forEach((company) => {
        if (company) {
            companies.push(company);
        }
    });

    // Event when the "Enter" key is pressed or an option is selected from the dropdown
    const handleSelection = () => {
        const inputValue = companySearch.value;
        // Find the selected company in a case-insensitive manner
        const selectedCompany = Array.from(companies).find(
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


// Keep track of the sorting order for each column
const sortOrders = {
    '#': false,
    'Difficulty': false,
    'Title': false,
    'Acceptance': false,
    'Rank': false,
};

function sortBy(column: string) {
    // Toggle the sort order for the selected column
    sortOrders[column] = !sortOrders[column];

    // Clear the existing table
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Sort the solutions based on the selected column
    switch (column) {
        case '#':
            solutions.sort((a, b) => (sortOrders[column] ? a.id - b.id : b.id - a.id));
            break;
        case 'Difficulty':
            solutions.sort((a, b) => (sortOrders[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
            solutions.sort((a, b) => (sortOrders[column] ? a.difficulty - b.difficulty : b.difficulty - a.difficulty));
            break;
        case 'Rank':
            solutions.sort((a, b) => (sortOrders[column] ? a.rank - b.rank : b.rank - a.rank));
            break;
        case 'Title':
            solutions.sort((a, b) => (sortOrders[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
            break;
        case 'Acceptance':
            solutions.sort((a, b) => (sortOrders[column] ? b.acceptance - a.acceptance : a.acceptance - b.acceptance));
            break;
        // Add other cases if needed
    }

    // Rebuild the table with sorted solutions
    rebuildTable();
}

/* Run the script */
main();