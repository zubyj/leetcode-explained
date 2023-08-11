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
        addCompanyProblems('Frequency'); // Change this line to sort by frequency by default
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

let minFrequency = Number.MAX_SAFE_INTEGER;
let maxFrequency = 0;

function addCompanyProblems(sortMethod: string) {
    chrome.storage.local.get('companyProblems', function (data) {
        // Get the problems for the selected company
        const companyProblems = data.companyProblems[companyName];
        console.log('companyProblems', companyProblems);

        // Reset max and min frequency
        maxFrequency = 0;
        minFrequency = Number.MAX_SAFE_INTEGER;
        if (Array.isArray(companyProblems)) {
            companyProblems.forEach((problem) => {
                const freq = problem.freq_alltime;
                if (freq > maxFrequency) maxFrequency = freq;
                if (freq < minFrequency) minFrequency = freq;
            });
        }

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

            // add frequency as a bar
            if (solution.frequency) {
                const frequencyCell = row.insertCell(2);
                const bar = document.createElement('div');
                const width = ((solution.frequency - minFrequency) / (maxFrequency - minFrequency)) * 100;
                bar.style.width = width + '%';
                bar.style.height = '10px';
                bar.style.backgroundColor = 'lightgreen';
                bar.style.borderRadius = '10px';
                frequencyCell.appendChild(bar);
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

// Keep track of the sorting order for each column
const sortOrders = {
    '#': true,
    'Title': true,
    'Score': true,
    'Frequency': true,
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
        case 'Title':
            solutions.sort((a, b) => (sortOrders[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
            break;
        case 'Frequency':
            solutions.sort((a, b) => (sortOrders[column] ? b.frequency - a.frequency : a.frequency - b.frequency));
            break;
        // Add other cases if needed
    }

    // Rebuild the table with sorted solutions
    solutions.forEach((solution) => {
        const row = table.insertRow(-1);
        row.insertCell(0).innerText = solution.id.toString();
        row.insertCell(1).innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;

        // Add frequency as a bar
        const frequencyCell = row.insertCell(2);
        const bar = document.createElement('div');
        const width = ((solution.frequency - minFrequency) / (maxFrequency - minFrequency)) * 100;
        bar.style.width = width + '%';
        bar.style.height = '10px';
        bar.style.backgroundColor = 'lightgreen';
        bar.style.borderRadius = '10px';
        frequencyCell.appendChild(bar);
    });
}

/* Run the script */
main();
