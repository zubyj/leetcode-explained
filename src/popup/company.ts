function main() {

    let companyName = "Amazon";


    chrome.storage.local.get("clickedCompany", function (data) {
        companyName = data.clickedCompany;
        document.getElementById("title").textContent = companyName;
        document.title = companyName + "'s favorite problems"
    });

    chrome.storage.local.get("leetcodeProblems", function (data) {
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

        solutions.sort((a, b) => b.score - a.score);

        solutions.forEach(solution => {
            const row = table.insertRow(-1);
            row.insertCell(0).innerText = solution.id;
            const titleCell = row.insertCell(1);
            titleCell.innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;
            row.insertCell(2).innerText = solution.score;
        });
    });
}

/* Run the script */
main();