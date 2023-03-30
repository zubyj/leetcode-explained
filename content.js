function injectVideo(title) {
    const solutionsTab = document.querySelectorAll('div.w-full.flex-col.overflow-auto')[1];
    if (solutionsTab) {
        const existingIframe = solutionsTab.parentElement.querySelector('iframe');
        if (!existingIframe) {
            // read from storage API and find the title in the JSON data
            chrome.storage.local.get(['leetcodeProblems'], (result) => {
                const problems = result.leetcodeProblems.questions;
                const problem = problems.find((problem) => problem.title === title);
                if (problem) {
                    const iframe = document.createElement("iframe");
                    iframe.src = problem.embedded_url;
                    iframe.width = "100%";
                    iframe.height = "100%";
                    iframe.allow =
                        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                    iframe.allowFullscreen = true;
                    solutionsTab.parentElement.insertBefore(iframe, solutionsTab);
                } else {
                    console.log(`Unable to find problem with title ${title} in the JSON file`);
                }
            });
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectVideo') {
        console.log('injected the video');
        let title = request.title.split('-')[0].trim();
        injectVideo(title);
    }
});

