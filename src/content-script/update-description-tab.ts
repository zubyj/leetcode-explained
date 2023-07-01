
// shows the Leetcode examples if the user has enabled it in the settings
function showExamples() {
    chrome.storage.local.get(['showExamples'], (result) => {
        let showExamples = result.showExamples;
        let descriptionContainer = document.querySelector('div._1l1MA') as Element;
        if (!descriptionContainer) {
            return;
        }
        let examples = descriptionContainer.getElementsByClassName('example');
        if (examples && examples.length > 0) {
            let parent = examples[0].parentNode as Element;
            if (!parent) {
                return;
            }
            let startIndex = Array.from(descriptionContainer.children).indexOf(parent);
            for (let i = startIndex; i < descriptionContainer.children.length; i++) {
                let child = descriptionContainer.children[i] as HTMLElement;
                child.style.display = showExamples ? 'block' : 'none';
            }
        }
    });
}

function addDrawingTool() {
    const drawingToolContainer = document.createElement('div');
    drawingToolContainer.textContent = 'Drawing Tool';
    drawingToolContainer.style.fontSize = '10px';
    drawingToolContainer.id = 'drawing-tool-container';

    drawingToolContainer.innerHTML = `
        <div class="container">
          <section class="tools-board">
            <div class="row">
              <label class="title">Shapes</label>
              <ul class="options">
                <li class="option tool" id="rectangle">
                  <img src="icons/rectangle.svg" alt="">
                  <span>Rectangle</span>
                </li>
                <li class="option tool" id="circle">
                  <img src="icons/circle.svg" alt="">
                  <span>Circle</span>
                </li>
                <li class="option tool" id="triangle">
                  <img src="icons/triangle.svg" alt="">
                  <span>Triangle</span>
                </li>
                <li class="option">
                  <input type="checkbox" id="fill-color">
                  <label for="fill-color">Fill color</label>
                </li>
              </ul>
            </div>
            <div class="row">
              <label class="title">Options</label>
              <ul class="options">
                <li class="option active tool" id="brush">
                  <img src="icons/brush.svg" alt="">
                  <span>Brush</span>
                </li>
                <li class="option tool" id="eraser">
                  <img src="icons/eraser.svg" alt="">
                  <span>Eraser</span>
                </li>
                <li class="option">
                  <input type="range" id="size-slider" min="1" max="30" value="5">
                </li>
              </ul>
            </div>
            <div class="row colors">
              <label class="title">Colors</label>
              <ul class="options">
                <li class="option"></li>
                <li class="option selected"></li>
                <li class="option"></li>
                <li class="option"></li>
                <li class="option">
                  <input type="color" id="color-picker" value="#4A98F7">
                </li>
              </ul>
            </div>
            <div class="row buttons">
              <button class="clear-canvas">Clear Canvas</button>
              <button class="save-img">Save As Image</button>
            </div>
          </section>
          <section class="drawing-board">
            <canvas></canvas>
          </section>
        </div>
    `

    const css = `
    .container{
      display: flex;
      width: 100%;
      gap: 10px;
      padding: 10px;
      max-width: 1050px;
    }
    section{
      background: #fff;
      border-radius: 7px;
    }
    .tools-board{
      width: 210px;
      padding: 15px 22px 0;
    }
    .tools-board .row{
      margin-bottom: 20px;
    }
    .row .options{
      list-style: none;
      margin: 10px 0 0 5px;
    }
    .row .options .option{
      display: flex;
      cursor: pointer;
      align-items: center;
      margin-bottom: 10px;
    }
    .option:is(:hover, .active) img{
      filter: invert(17%) sepia(90%) saturate(3000%) hue-rotate(900deg) brightness(100%) contrast(100%);
    }
    .option :where(span, label){
      color: #5A6168;
      cursor: pointer;
      padding-left: 10px;
    }
    .option:is(:hover, .active) :where(span, label){
      color: #4A98F7;
    }
    .option #fill-color{
      cursor: pointer;
      height: 14px;
      width: 14px;
    }
    #fill-color:checked ~ label{
      color: #4A98F7;
    }
    .option #size-slider{
      width: 100%;
      height: 5px;
      margin-top: 10px;
    }
    .colors .options{
      display: flex;
      justify-content: space-between;
    }
    .colors .option{
      height: 20px;
      width: 20px;
      border-radius: 50%;
      margin-top: 3px;
      position: relative;
    }
    .colors .option:nth-child(1){
      background-color: #fff;
      border: 1px solid #bfbfbf;
    }
    .colors .option:nth-child(2){
      background-color: #000;
    }
    .colors .option:nth-child(3){
      background-color: #E02020;
    }
    .colors .option:nth-child(4){
      background-color: #6DD400;
    }
    .colors .option:nth-child(5){
      background-color: #4A98F7;
    }
    .colors .option.selected::before{
      position: absolute;
      content: "";
      top: 50%;
      left: 50%;
      height: 12px;
      width: 12px;
      background: inherit;
      border-radius: inherit;
      border: 2px solid #fff;
      transform: translate(-50%, -50%);
    }
    .colors .option:first-child.selected::before{
      border-color: #ccc;
    }
    .option #color-picker{
      opacity: 0;
      cursor: pointer;
    }
    .buttons button{
      width: 100%;
      color: #fff;
      border: none;
      outline: none;
      padding: 11px 0;
      font-size: 0.9rem;
      margin-bottom: 13px;
      background: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .buttons .clear-canvas{
      color: #6C757D;
      border: 1px solid #6C757D;
      transition: all 0.3s ease;
    }
    .clear-canvas:hover{
      color: #fff;
      background: #6C757D;
    }
    .buttons .save-img{
      background: #4A98F7;
      border: 1px solid #4A98F7;
    }
    .drawing-board{
      flex: 1;
      overflow: hidden;
    }
    .drawing-board canvas{
      width: 100%;
      height: 100%;
    }
        `

    const style = document.createElement('style')
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
    document.body.appendChild(drawingToolContainer);
}

function showDifficulty() {
    chrome.storage.local.get(['showDifficulty'], (result) => {
        let showDifficulty = result.showDifficulty;

        let colors = ['bg-olive', 'bg-yellow', 'bg-red'];
        for (let color in colors) {
            let difficultyContainer = document.querySelectorAll('div.' + colors[color])[0];
            if (difficultyContainer) {
                difficultyContainer.style.display = showDifficulty ? 'block' : 'none';
            }
        }
    });
}

function showCompanyTags(problemTitle: string) {
    chrome.storage.local.get(['showCompanyTags'], (result) => {
        let showCompanyTags = result.showCompanyTags;
        let companyTagContainer = document.getElementById('companyTagContainer');

        if (!showCompanyTags) {
            if (companyTagContainer) {
                companyTagContainer.style.display = 'none';
            }
            return;
        }

        // Always re-load company tags, regardless if container already exists
        if (companyTagContainer) {
            // Remove old tags
            while (companyTagContainer.firstChild) {
                companyTagContainer.firstChild.remove();
            }
        } else {
            companyTagContainer = document.createElement('div');
            companyTagContainer.id = 'companyTagContainer';
            companyTagContainer.style.display = 'flex';
            companyTagContainer.style.flexDirection = 'row';
            companyTagContainer.style.marginTop = '10px';
            companyTagContainer.style.gap = '5px';
            const descriptionBtns = document.querySelectorAll('div.mt-3.flex')[0];
            if (descriptionBtns) {
                descriptionBtns.parentElement?.appendChild(companyTagContainer);
            }
        }

        // Load new tags
        loadCompanyTags(problemTitle, companyTagContainer);
    });
}

function loadCompanyTags(problemTitle: string, companyTagContainer: HTMLElement) {
    // create a new container for buttons
    companyTagContainer.id = 'companyTagContainer';  // add an id
    companyTagContainer.style.display = 'flex';
    companyTagContainer.style.flexDirection = 'row';
    companyTagContainer.style.marginTop = '10px';
    companyTagContainer.style.gap = '5px';

    const descriptionBtns = document.querySelectorAll('div.mt-3.flex')[0];
    if (!descriptionBtns) {
        return;
    }
    descriptionBtns.parentElement?.appendChild(companyTagContainer);

    interface problem {
        title: string;
        companies: Array<{
            name: string;
            score: number;
        }>;
    }

    chrome.storage.local.get(['leetcodeProblems'], (result) => {
        const problem = result.leetcodeProblems.questions.find((problem: problem) => problem.title === problemTitle);
        if (problem.companies && problem.companies.length > 0) {
            const topCompanies = problem.companies.slice(0, 5);
            // create a button for each company
            topCompanies.forEach((company: { name: string; score: any; }) => {
                const button = document.createElement('button');

                // opens the company page when the button is clicked
                button.onclick = () => {
                    chrome.runtime.sendMessage({
                        // passes the company name and score to the background script
                        action: 'openCompanyPage', company: company.name
                    })
                }


                // on hover, set background color to black
                button.onmouseover = () => {
                    button.style.color = 'orange';
                }
                button.onmouseout = () => {
                    button.style.color = 'white';
                }

                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';

                const icon = document.createElement('img');
                icon.src = `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s/g, '')}.com`; // replace spaces with nothing
                icon.style.height = '12px';
                icon.style.width = '12px';
                icon.style.marginRight = '5px';  // some space between the icon and the name
                button.appendChild(icon);

                button.style.color = '#fff';
                button.style.minWidth = '100px';
                button.style.height = '25px';
                button.style.padding = '1px';
                button.style.backgroundColor = '#373737';
                button.style.borderRadius = '10px';
                button.style.fontSize = '10px';

                const companyName = document.createTextNode(`${company.name}`);
                button.appendChild(companyName);

                const score = document.createElement('span');
                score.textContent = ` ${company.score}`;
                score.style.fontSize = '12px';
                score.style.fontWeight = 'bold';
                score.style.fontFamily = 'monospace';
                score.style.marginLeft = '5px';  // some space between the name and the score
                button.appendChild(score);
                companyTagContainer!.appendChild(button);
            });
        }
    });
    if (descriptionBtns.parentElement) descriptionBtns.parentElement.appendChild(companyTagContainer);
    return companyTagContainer;
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateDescription') {
        showExamples();
        showCompanyTags(request.title.split('-')[0].trim());
        showDifficulty();
        addDrawingTool();
    }
});
