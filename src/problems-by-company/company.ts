/*
 * Extension page listing the top 50 problems for a company, with sortable
 * columns and a search box across all companies in the dataset.
 */

interface Solution {
    id: number;
    rank: number;
    title: string;
    difficulty: string;
    url: string;
    frequency: number;
    recent: boolean;
}

interface Question {
    title: string;
    frontend_id: number;
    difficulty_lvl?: number;
    acceptance?: number;
}

const FEATURED_COMPANIES = ['Amazon', 'Apple', 'Facebook', 'Google', 'Microsoft'];

const solutions: Solution[] = [];
let companyName = 'Amazon';

const sortOrders: { [key: string]: boolean } = {};

function main() {
    chrome.storage.local.get('clickedCompany', (data) => {
        companyName = data.clickedCompany || 'Amazon';
        const title = document.getElementById('title');
        if (title) title.textContent = `${companyName}: most-asked problems`;
        document.title = `${companyName} Questions`;
        loadCompanyProblems();
    });

    ['#', 'Difficulty', 'Title', 'Frequency', 'Recent'].forEach((column) => {
        document.getElementById(column)?.addEventListener('click', () => sortBy(column));
    });

    buildFeaturedCompanyNav();
    buildCompanySearch();
}

function openCompany(company: string) {
    chrome.storage.local.set({ clickedCompany: company }, () => location.reload());
}

function buildFeaturedCompanyNav() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    FEATURED_COMPANIES.forEach((company) => {
        const button = document.createElement('button');
        button.onclick = () => openCompany(company);

        const icon = document.createElement('img');
        icon.src = `https://www.google.com/s2/favicons?domain=${company.toLowerCase().replace(/\s/g, '')}.com&sz=32`;
        icon.onerror = () => icon.remove();
        button.appendChild(icon);
        button.appendChild(document.createTextNode(company));
        navbar.appendChild(button);
    });
}

function loadCompanyProblems() {
    chrome.storage.local.get(['companyProblems', 'leetcodeProblems'], (data) => {
        const companyProblems = data.companyProblems?.[companyName];
        const questions: Question[] = data.leetcodeProblems?.questions || [];
        if (!Array.isArray(companyProblems)) return;

        solutions.length = 0;
        companyProblems.forEach((problem: { id: number; rank: number; title: string; frequency?: number; recent?: boolean }) => {
            const question = questions.find((q) => q.frontend_id === problem.id);
            solutions.push({
                id: problem.id,
                rank: problem.rank,
                title: problem.title,
                url: `https://leetcode.com/problems/${problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
                difficulty: question ? String(question.difficulty_lvl) : 'N/A',
                frequency: problem.frequency || 0,
                recent: !!problem.recent,
            });
        });
        rebuildTable();
    });
}

function rebuildTable() {
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    const difficultyNames: Record<string, [string, string]> = {
        '1': ['Easy', 'difficulty-easy'],
        '2': ['Medium', 'difficulty-medium'],
        '3': ['Hard', 'difficulty-hard'],
    };

    solutions.forEach((solution) => {
        const row = table.insertRow(-1);
        row.insertCell(0).innerText = solution.id.toString();

        const difficultyCell = row.insertCell(1);
        const [label, className] = difficultyNames[solution.difficulty] || ['N/A', ''];
        difficultyCell.innerText = label;
        if (className) difficultyCell.classList.add(className);

        const titleCell = row.insertCell(2);
        const link = document.createElement('a');
        link.href = solution.url;
        link.target = '_blank';
        link.textContent = solution.title;
        titleCell.appendChild(link);

        row.insertCell(3).innerText = solution.frequency.toFixed(0);
        const recentCell = row.insertCell(4);
        recentCell.innerText = solution.recent ? 'Yes' : '';
        if (solution.recent) recentCell.classList.add('recent');
    });
}

function buildCompanySearch() {
    const companySearch = document.getElementById('companySearch') as HTMLInputElement;
    const companyList = document.getElementById('companyList') as HTMLDataListElement;

    chrome.storage.local.get('companyProblems', (data) => {
        const companies = Object.keys(data.companyProblems || {}).sort();

        companies.forEach((company) => {
            const option = document.createElement('option');
            option.value = company;
            companyList.appendChild(option);
        });

        const handleSelection = () => {
            const match = companies.find((c) => c.toLowerCase() === companySearch.value.toLowerCase());
            if (match) openCompany(match);
        };
        companySearch.addEventListener('change', handleSelection);
        companySearch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') handleSelection();
        });
    });
}

function sortBy(column: string) {
    sortOrders[column] = !sortOrders[column];
    const ascending = sortOrders[column];

    const comparators: { [key: string]: (a: Solution, b: Solution) => number } = {
        '#': (a, b) => a.id - b.id,
        'Difficulty': (a, b) => a.difficulty.localeCompare(b.difficulty),
        'Title': (a, b) => a.title.localeCompare(b.title),
        'Frequency': (a, b) => a.frequency - b.frequency,
        'Recent': (a, b) => Number(a.recent) - Number(b.recent),
    };

    const comparator = comparators[column];
    if (!comparator) return;
    solutions.sort((a, b) => (ascending ? comparator(a, b) : comparator(b, a)));
    rebuildTable();
}

main();
