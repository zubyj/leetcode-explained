/*
 * The only content script for leetcode.com. Handles:
 *   - an "Explained" tab in LeetCode's tab bar (videos, solution code, companies)
 *   - description tab extras (company chips, rating badge, example/difficulty toggles)
 *   - reading the problem + user code for the AI popup
 *   - reporting LeetCode's theme to the popup
 *
 * All styling lives in src/styles/leetcode.css, scoped by html.dark, so there
 * is no theme-sync JS anywhere on the page. Compiled as a plain script (no
 * imports) so it can run as a classic MV3 content script without bundling.
 */

interface LceVideo {
    embedded_url: string;
    channel: string;
}

interface LceProblem {
    title: string;
    frontend_id: number;
    rating?: string;
    videos?: LceVideo[];
    languages?: string[];
    companies?: Array<{ name: string }>;
}

interface LceSettings {
    showExamples: boolean;
    showDifficulty: boolean;
    showCompanyTags: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
    python: 'Python',
    java: 'Java',
    javascript: 'JavaScript',
    cpp: 'C++',
};

const LANGUAGE_EXTENSIONS: Record<string, string> = {
    python: 'py',
    java: 'java',
    javascript: 'js',
    cpp: 'cpp',
};

function problemTitleFromPage(): string {
    return document.title.replace(' - LeetCode', '').split('-')[0].trim();
}

function companyLogoUrl(company: string): string {
    return `https://www.google.com/s2/favicons?domain=${company.toLowerCase().replace(/\s/g, '')}.com&sz=32`;
}

function descriptionContainer(): Element | null {
    return document.querySelector('[data-track-load="description_content"]')
        || document.getElementsByClassName('elfjS')[0]
        || null;
}

function getStorage<T>(keys: string[]): Promise<T> {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => resolve(result as T));
    });
}

async function findProblemData(title: string): Promise<LceProblem | undefined> {
    const { leetcodeProblems } = await getStorage<{ leetcodeProblems?: { questions: LceProblem[] } }>(['leetcodeProblems']);
    return leetcodeProblems?.questions.find((q) => q.title === title);
}

async function getSettings(): Promise<LceSettings> {
    const result = await getStorage<Partial<LceSettings>>(['showExamples', 'showDifficulty', 'showCompanyTags']);
    return {
        showExamples: result.showExamples !== false,
        showDifficulty: result.showDifficulty !== false,
        showCompanyTags: result.showCompanyTags !== false,
    };
}

/* Waits for an element to exist, surviving LeetCode's slow React renders. */
function waitForElement(selector: () => Element | null, timeoutMs = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
        const existing = selector();
        if (existing) {
            resolve(existing);
            return;
        }
        const observer = new MutationObserver(() => {
            const el = selector();
            if (el) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        const timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeoutMs);
    });
}

/* ---------------- Description tab ---------------- */

async function renderDescriptionExtras() {
    if (window.location.pathname.includes('/solutions')) return;

    const title = problemTitleFromPage();
    const settings = await getSettings();
    const problem = await findProblemData(title);

    toggleExamples(settings.showExamples);
    toggleDifficulty(settings.showDifficulty);
    renderRating(problem);
    await renderCompanyChips(problem, settings.showCompanyTags);
}

function toggleExamples(show: boolean) {
    const container = descriptionContainer();
    if (!container) return;
    Array.from(container.getElementsByTagName('pre')).forEach((tag) => {
        tag.style.display = show ? 'block' : 'none';
    });
}

function toggleDifficulty(show: boolean) {
    const badge = document.querySelectorAll('div.relative.inline-flex')[0] as HTMLElement | undefined;
    if (badge) badge.style.display = show ? 'block' : 'none';
}

function renderRating(problem: LceProblem | undefined) {
    document.getElementById('lce-rating')?.remove();
    if (!problem?.rating) return;

    const badge = document.querySelectorAll('div.relative.inline-flex')[0];
    if (!badge?.parentElement) return;

    const rating = document.createElement('span');
    rating.id = 'lce-rating';
    rating.classList.add('lce-rating');
    rating.title = 'Difficulty rating (Elo)';
    rating.textContent = problem.rating;
    badge.parentElement.insertBefore(rating, badge.parentElement.firstChild);
}

async function renderCompanyChips(problem: LceProblem | undefined, show: boolean) {
    document.getElementById('lce-company-row')?.remove();
    if (!show || !problem?.companies?.length) return;

    const description = await waitForElement(descriptionContainer);
    if (!description || document.getElementById('lce-company-row')) return;

    const row = buildCompanyRow(problem.companies.slice(0, 5));
    row.id = 'lce-company-row';
    description.insertBefore(row, description.firstChild);
}

/* ---------------- "Explained" tab ---------------- */

/*
 * A fifth tab next to Submissions in LeetCode's tab bar. Only the button is
 * added at page load; the panel (videos, solution code, companies) is built
 * the first time the tab is clicked. The button reuses flexlayout's own class
 * names so it picks up LeetCode's styling and theme.
 */
const EXPLAINED_TAB_ID = 'lce-explained-tab';

function tabBarContainer(): HTMLElement | null {
    return document.querySelector('.flexlayout__tabset_tabbar_inner_tab_container');
}

function ensureExplainedTab() {
    const container = tabBarContainer();
    if (!container || document.getElementById(EXPLAINED_TAB_ID)) return;
    if (!container.querySelector('.flexlayout__tab_button')) return;

    const divider = document.createElement('div');
    divider.className = 'flexlayout__tabset_tab_divider';

    const button = document.createElement('div');
    button.id = EXPLAINED_TAB_ID;
    button.className = 'flexlayout__tab_button flexlayout__tab_button_top flexlayout__tab_button--unselected';

    const content = document.createElement('div');
    content.className = 'flexlayout__tab_button_content';
    const inner = document.createElement('div');
    inner.className = 'relative flex items-center gap-1 overflow-hidden text-sm capitalize';
    const icon = document.createElement('span');
    icon.className = 'lce-tab-icon';
    icon.textContent = '◆';
    const label = document.createElement('div');
    label.className = 'medium whitespace-nowrap font-medium';
    label.textContent = 'Explained';
    inner.append(icon, label);
    content.appendChild(inner);
    button.appendChild(content);
    button.onclick = openExplainedPanel;

    container.append(divider, button);

    if (!container.dataset.lceBound) {
        container.dataset.lceBound = '1';
        container.addEventListener('click', (event) => {
            if (!(event.target as Element).closest(`#${EXPLAINED_TAB_ID}`)) closeExplainedPanel();
        }, true);
    }
}

async function openExplainedPanel() {
    const container = tabBarContainer();
    const tabset = container?.closest('.flexlayout__tabset') as HTMLElement | null;
    const tabBar = tabset?.querySelector('.flexlayout__tabset_tabbar_outer') as HTMLElement | null;
    if (!container || !tabset || !tabBar) return;

    const title = problemTitleFromPage();
    let panel = tabset.querySelector('.lce-panel') as HTMLElement | null;
    if (!panel || panel.getAttribute('data-problem') !== title) {
        panel?.remove();
        panel = await buildExplainedPanel(title);
        tabset.appendChild(panel);
    }
    panel.style.top = `${tabBar.offsetHeight}px`;
    panel.style.display = 'block';

    container.classList.add('lce-explained-open');
    document.getElementById(EXPLAINED_TAB_ID)?.classList.replace('flexlayout__tab_button--unselected', 'flexlayout__tab_button--selected');
}

function closeExplainedPanel() {
    const panel = document.querySelector('.lce-panel') as HTMLElement | null;
    if (panel) panel.style.display = 'none';
    tabBarContainer()?.classList.remove('lce-explained-open');
    document.getElementById(EXPLAINED_TAB_ID)?.classList.replace('flexlayout__tab_button--selected', 'flexlayout__tab_button--unselected');
}

async function buildExplainedPanel(title: string): Promise<HTMLElement> {
    const panel = document.createElement('div');
    panel.classList.add('lce-panel');
    panel.setAttribute('data-problem', title);

    const problem = await findProblemData(title);
    const hasVideos = !!problem?.videos?.length;
    const hasCode = !!problem?.languages?.length;

    if (!problem || (!hasVideos && !hasCode)) {
        const empty = document.createElement('p');
        empty.classList.add('lce-empty');
        empty.textContent = 'No video explanations or solution code for this problem yet.';
        panel.appendChild(empty);
        return panel;
    }

    if (problem.companies?.length) {
        panel.appendChild(buildPanelSection('Asked by', buildCompanyRow(problem.companies)));
    }
    if (hasVideos) {
        panel.appendChild(buildPanelSection('Video explanations', buildVideoSection(problem.videos as LceVideo[])));
    }
    if (hasCode) {
        const code = buildCodeSection(problem);
        panel.appendChild(buildPanelSection('Solution code', code));
        const preferred = code.querySelector(`.lce-chip[data-language="${editorLanguage()}"]`) || code.querySelector('.lce-chip');
        (preferred as HTMLButtonElement | null)?.click();
    }
    return panel;
}

/* The language currently selected in LeetCode's editor, in our naming. */
function editorLanguage(): string {
    const pickers = Array.from(document.querySelectorAll('[data-cy="lang-select"], button[aria-haspopup="dialog"]'));
    const picker = pickers.find((el) => /^(python3?|c\+\+|javascript|typescript|java)$/i.test((el.textContent || '').trim()));
    const label = (picker?.textContent || '').trim().toLowerCase();
    if (label.startsWith('python')) return 'python';
    if (label.startsWith('c++')) return 'cpp';
    if (label.startsWith('javascript') || label.startsWith('typescript')) return 'javascript';
    if (label.startsWith('java')) return 'java';
    return '';
}

function buildPanelSection(heading: string, body: HTMLElement): HTMLElement {
    const section = document.createElement('section');
    section.classList.add('lce-panel-section');
    const h = document.createElement('h3');
    h.classList.add('lce-panel-heading');
    h.textContent = heading;
    section.append(h, body);
    return section;
}

function buildCompanyRow(companies: Array<{ name: string }>): HTMLElement {
    const row = document.createElement('div');
    row.classList.add('lce-company-row');
    companies.slice(0, 8).forEach((company) => {
        const chip = document.createElement('button');
        chip.classList.add('lce-company-chip');
        chip.onclick = () => {
            chrome.runtime.sendMessage({ action: 'openCompanyPage', company: company.name });
        };
        const icon = document.createElement('img');
        icon.src = companyLogoUrl(company.name);
        icon.onerror = () => icon.remove();
        chip.appendChild(icon);
        chip.appendChild(document.createTextNode(company.name));
        row.appendChild(chip);
    });
    return row;
}

function buildVideoSection(videos: LceVideo[]): HTMLElement {
    const section = document.createElement('div');
    section.classList.add('lce-section');

    const controls = document.createElement('div');
    controls.classList.add('lce-video-controls');

    const channel = document.createElement('div');
    channel.classList.add('lce-channel');
    channel.textContent = videos[0].channel;

    const frame = document.createElement('div');
    frame.classList.add('lce-video-frame');
    const iframe = document.createElement('iframe');
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);

    let index = 0;
    const showVideo = (i: number) => {
        index = (i + videos.length) % videos.length;
        iframe.src = videos[index].embedded_url;
        channel.textContent = videos[index].channel;
    };

    const prev = document.createElement('button');
    prev.textContent = '←';
    prev.onclick = () => showVideo(index - 1);
    const next = document.createElement('button');
    next.textContent = '→';
    next.onclick = () => showVideo(index + 1);

    controls.append(prev, channel, next);
    section.append(controls, frame);
    showVideo(0);
    return section;
}

function buildCodeSection(problem: LceProblem): HTMLElement {
    const section = document.createElement('div');
    section.classList.add('lce-section');

    const langRow = document.createElement('div');
    langRow.classList.add('lce-lang-row');

    const scroll = document.createElement('div');
    scroll.classList.add('lce-code-scroll');

    const codeBlock = document.createElement('pre');
    codeBlock.classList.add('lce-code-block');
    codeBlock.textContent = 'Select a language to view the solution.';

    const copyButton = document.createElement('button');
    copyButton.classList.add('lce-copy-btn');
    copyButton.title = 'Copy code';
    const copyIcon = document.createElement('img');
    copyIcon.src = chrome.runtime.getURL('src/assets/images/copy-icon.png');
    copyButton.appendChild(copyIcon);
    copyButton.onclick = () => {
        navigator.clipboard.writeText(codeBlock.textContent || '').then(() => {
            copyIcon.src = chrome.runtime.getURL('src/assets/images/check-icon.png');
            setTimeout(() => {
                copyIcon.src = chrome.runtime.getURL('src/assets/images/copy-icon.png');
            }, 1000);
        });
    };

    scroll.append(codeBlock, copyButton);

    (problem.languages || []).forEach((language) => {
        const chip = document.createElement('button');
        chip.classList.add('lce-chip');
        chip.dataset.language = language;

        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL(`src/assets/images/languages/${language}.svg`);
        chip.appendChild(icon);
        chip.appendChild(document.createTextNode(LANGUAGE_LABELS[language] || language));

        chip.onclick = async () => {
            langRow.querySelectorAll('.lce-chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            codeBlock.textContent = 'Loading ...';
            const code = await fetchSolutionCode(problem.title, problem.frontend_id, language);
            codeBlock.textContent = code || 'Code not available';
        };

        langRow.appendChild(chip);
    });

    section.append(langRow, scroll);
    return section;
}

/* Fetches the solution from NeetCode's GitHub repo. */
async function fetchSolutionCode(title: string, frontendId: number, language: string): Promise<string | null> {
    const extension = LANGUAGE_EXTENSIONS[language];
    if (!extension) return null;

    const slug = `${frontendId.toString().padStart(4, '0')}-${title.toLowerCase().replace(/ /g, '-')}`;
    const url = `https://api.github.com/repos/neetcode-gh/leetcode/contents/${language}/${slug}.${extension}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return atob(data.content);
    } catch {
        return null;
    }
}

/* ---------------- Problem/code reader for the popup ---------------- */

function readProblemForAI(): string[] {
    const collected: string[] = [];

    const description = descriptionContainer();
    if (description?.children) {
        collected.push('\nHeres the description, examples, and constraints for the problem\n');
        Array.from(description.children).forEach((child) => {
            if (child.textContent) collected.push(child.textContent);
        });
    }

    const editorLines = document.getElementsByClassName('view-line');
    if (editorLines.length) {
        collected.push('\n--- Function Definition and Current Code ---\n');
        Array.from(editorLines).forEach((line) => {
            if (line.textContent) collected.push(line.textContent);
        });
    }

    const consoleData = readConsolePanel();
    if (consoleData.length) {
        collected.push('\n--- Test Cases and Results ---\n' + consoleData.join('\n'));
    }

    const errorPanel = document.querySelector('div.font-menlo.whitespace-pre-wrap.break-all.text-xs.text-red-60');
    const errorText = errorPanel?.textContent?.trim();
    if (errorText) {
        collected.push('\n--- LeetCode Error Message ---\n' + errorText);
        collected.push('\nPlease fix the above error in the code.');
    }

    return collected;
}

function readConsolePanel(): string[] {
    const results: string[] = [];

    const testCaseContainer = document.querySelector('div.space-y-4');
    if (testCaseContainer) {
        const inputs = testCaseContainer.querySelectorAll('[data-e2e-locator="console-testcase-input"]');
        const labels = testCaseContainer.querySelectorAll('.text-xs.font-medium');
        labels.forEach((label, index) => {
            const value = inputs[index]?.textContent?.trim() || '';
            if (label.textContent && value) results.push(`${label.textContent} ${value}`);
        });
    }

    document.querySelectorAll('div.flex.h-full.w-full.flex-col.space-y-2').forEach((container) => {
        const label = container.querySelector('div.flex.text-xs.font-medium');
        const value = container.querySelector('div.font-menlo.relative.mx-3.whitespace-pre-wrap')?.textContent?.trim() || '';
        if (label?.textContent?.includes('Output') && value) {
            results.push(`Current Output: ${value}`);
        } else if (label?.textContent?.includes('Expected') && value) {
            results.push(`Expected Output: ${value}`);
        }
    });

    return results;
}

/* ---------------- Messages + navigation ---------------- */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getProblem') {
        sendResponse({ data: readProblemForAI() });
    } else if (request.action === 'getTheme') {
        sendResponse({ theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } else if (request.action === 'settingsUpdate') {
        renderDescriptionExtras();
    }
    return true;
});

let lceLastPath = '';
let lcePendingRender: number | null = null;

function scheduleRender() {
    if (lcePendingRender !== null) clearTimeout(lcePendingRender);
    lcePendingRender = window.setTimeout(() => {
        lcePendingRender = null;
        ensureExplainedTab();
        renderDescriptionExtras();
    }, 150);
}

function watchNavigation() {
    /*
     * LeetCode is a SPA, so a single observer on the URL + title covers tab
     * switches, problem changes, and soft reloads. Renders are idempotent and
     * debounced, so over-triggering is harmless.
     */
    const observer = new MutationObserver(() => {
        const path = location.pathname + '|' + document.title;
        if (path !== lceLastPath) {
            if (lceLastPath) closeExplainedPanel();
            lceLastPath = path;
            scheduleRender();
        }
    });
    observer.observe(document, { subtree: true, childList: true });
    scheduleRender();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchNavigation);
} else {
    watchNavigation();
}
