/*
 * The only content script for leetcode.com. Handles:
 *   - description tab enhancements (company chips, rating badge, example/difficulty toggles)
 *   - solutions tab card (video carousel + solution code by language)
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

function onSolutionsTab(): boolean {
    return window.location.pathname.includes('/solutions');
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
    if (onSolutionsTab()) return;

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

    const row = document.createElement('div');
    row.id = 'lce-company-row';
    row.classList.add('lce-company-row');

    problem.companies.slice(0, 5).forEach((company) => {
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

    description.insertBefore(row, description.firstChild);
}

/* ---------------- Solutions tab ---------------- */

async function renderSolutionsCard() {
    if (!onSolutionsTab()) return;

    const title = problemTitleFromPage();
    const existing = document.querySelector('.lce-wrapper');
    if (existing) {
        if (existing.getAttribute('data-problem') === title && document.contains(existing)) return;
        existing.remove();
    }

    const problem = await findProblemData(title);
    const hasVideos = !!problem?.videos?.length;
    const hasCode = !!problem?.languages?.length;
    if (!problem || (!hasVideos && !hasCode)) return;

    /*
     * The solutions panel is a scroll container whose first child holds the
     * search + filter bar. The card goes right after that block, above the
     * list of posts.
     */
    const searchInput = await waitForElement(() => document.querySelector('input[placeholder^="Search content"], input.block'));
    const scroller = searchInput?.closest('.overflow-auto');
    if (!searchInput || !scroller || document.querySelector('.lce-wrapper')) return;
    const filterBlock = Array.from(scroller.children).find((child) => child.contains(searchInput));
    if (!filterBlock) return;

    const wrapper = document.createElement('div');
    wrapper.classList.add('lce-wrapper');
    wrapper.setAttribute('data-problem', title);

    const sections: Record<string, HTMLElement> = {};
    if (hasVideos) sections['Video'] = buildVideoSection(problem.videos as LceVideo[]);
    if (hasCode) sections['Code'] = buildCodeSection(problem);

    wrapper.appendChild(buildNav(sections));
    Object.values(sections).forEach((section) => wrapper.appendChild(section));

    scroller.insertBefore(wrapper, filterBlock.nextSibling);
}

/* Video / Code act as toggles: clicking the open one collapses the card. */
function buildNav(sections: Record<string, HTMLElement>): HTMLElement {
    const nav = document.createElement('div');
    nav.classList.add('lce-nav');

    const label = document.createElement('span');
    label.classList.add('lce-nav-label');
    label.textContent = 'Leetcode Explained';
    nav.appendChild(label);

    let open: string | null = null;
    const toggleSection = (name: string) => {
        open = open === name ? null : name;
        Object.entries(sections).forEach(([key, section]) => {
            section.style.display = key === open ? 'block' : 'none';
        });
        nav.querySelectorAll('.lce-nav-button').forEach((btn) => {
            btn.classList.toggle('active', btn.textContent === open);
        });
    };

    Object.keys(sections).forEach((name) => {
        const button = document.createElement('button');
        button.classList.add('lce-nav-button');
        button.textContent = name;
        button.onclick = () => toggleSection(name);
        nav.appendChild(button);
    });

    return nav;
}

function buildVideoSection(videos: LceVideo[]): HTMLElement {
    const section = document.createElement('div');
    section.classList.add('lce-section');
    section.style.display = 'none';

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
    section.style.display = 'none';

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
        renderDescriptionExtras();
        renderSolutionsCard();
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
