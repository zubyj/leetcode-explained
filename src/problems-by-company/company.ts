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
    chrome.storage.local.get('leetcodeProblems', function (items: { [key: string]: any; }) {
        const data = items as { leetcodeProblems: LeetcodeProblems };
        data.leetcodeProblems.questions.forEach((question: Question) => {
            if (!question.companies) return;
            question.companies.forEach((company: Company) => {
                if (company.name === companyName) {
                    solutions.push({
                        id: question.frontend_id,
                        title: question.title,
                        score: company.score,
                        url: `https://leetcode.com/problems/${question.title.replace(/\s/g, '-')}/`,
                    });
                }
            });
        });

        const table = document.getElementById('solutionTable') as HTMLTableElement;

        if (sortMethod === 'Score') {
            solutions.sort((a, b) => b.score - a.score);
        }

        solutions.forEach(solution => {
            const row = table.insertRow(-1);
            row.insertCell(0).innerText = solution.id.toString();
            const titleCell = row.insertCell(1);
            titleCell.innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;
            const scoreCell = row.insertCell(2);
            scoreCell.innerText = solution.score.toString();
            const score = solution.score;
            const color = getColorForScore(score);
            scoreCell.style.color = color;
            scoreCell.style.fontWeight = 'bold';
        });

        function getColorForScore(score: number) {
            const percent = score / 100;
            const red = Math.floor(255 * (1 - percent));
            const green = Math.floor(255 * percent);
            const blue = 0;
            return `rgb(${red}, ${green}, ${blue})`;
        }
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
        const color = getColorForScore(score);
        scoreCell.style.color = color;
        scoreCell.style.fontWeight = 'bold';
    });

    function getColorForScore(score: number) {
        const percent = score / 100;
        const red = Math.floor(255 * (1 - percent));
        const green = Math.floor(255 * percent);
        const blue = 0;
        return `rgb(${red}, ${green}, ${blue})`;
    }
}

/* Run the script */
main();
