

function main() {
    chrome.storage.local.get("leetcodeProblems", function (data) {
        const companyName = "Amazon";
        let solutions = [];

        console.log(data);

        data.leetcodeProblems.questions.forEach(question => {
            if (!question.companies) return;
            question.companies.forEach(company => {
                if (company.name === companyName) {
                    solutions.push({
                        id: question.frontend_id,
                        title: question.title,
                        score: company.score,
                        url: `https://leetcode.com/problems/${question.title.replace(/\s/g, '-')}/`
                    });
                }
            });
        });

        const table = document.getElementById("solutionTable");
        solutions.forEach(solution => {
            const row = table.insertRow(-1);
            row.insertCell(0).innerText = solution.id;
            const titleCell = row.insertCell(1);
            titleCell.innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;
            row.insertCell(2).innerText = solution.score;
        });
    });

    document.getElementById("test")?.textContent = "Hello World!";
}

/* Run the script */
main();