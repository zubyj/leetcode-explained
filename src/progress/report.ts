/*
 * Full-page progress report. Everything is derived from the submissions the
 * content script recorded into chrome.storage.local; no network.
 */

import { computeStats, loadSubmissions, SubmissionRecord } from '../popup/progress.js';

const DAY_MS = 24 * 60 * 60 * 1000;

let allRecords: SubmissionRecord[] = [];

function startOfDay(ms: number): number {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function dayKey(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

function setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function relativeTime(ms: number): string {
    const diff = Date.now() - ms;
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function inRange(records: SubmissionRecord[], rangeDays: number): SubmissionRecord[] {
    if (!rangeDays) return records;
    const since = startOfDay(Date.now()) - (rangeDays - 1) * DAY_MS;
    return records.filter((r) => r.at >= since);
}

/* ---------------- Rendering ---------------- */

function renderTiles(records: SubmissionRecord[], rangeDays: number) {
    const stats = computeStats(records);
    const rangeLabel = rangeDays ? `in the last ${rangeDays} days` : 'all time';
    const acceptedCount = records.filter((r) => r.accepted).length;
    const rate = records.length ? Math.round((acceptedCount / records.length) * 100) : 0;
    const activeDays = new Set(records.filter((r) => r.accepted).map((r) => dayKey(startOfDay(r.at)))).size;

    setText('t-solved', String(stats.totalSolved));
    setText('t-solved-sub', `${stats.solvedWeek} this week · ${rangeLabel}`);
    setText('t-streak', String(computeStats(allRecords).streak));
    setText('t-streak-sub', stats.solvedToday ? `${stats.solvedToday} solved today` : 'nothing solved today yet');
    setText('t-accept', `${rate}%`);
    setText('t-accept-sub', `${acceptedCount} of ${records.length} submissions`);
    setText('t-active', String(activeDays));
    setText('t-active-sub', rangeDays ? `of ${rangeDays} days` : 'days with a solve');
}

function renderHeatmap(records: SubmissionRecord[], rangeDays: number) {
    const stats = computeStats(records);
    const heatmap = document.getElementById('heatmap') as HTMLElement;
    heatmap.textContent = '';

    const days = rangeDays || 365;
    const todayStart = startOfDay(Date.now());
    const firstDay = todayStart - (days - 1) * DAY_MS;
    // Pad back to a Sunday so weekday rows line up.
    const leading = new Date(firstDay).getDay();
    const start = firstDay - leading * DAY_MS;
    const total = days + leading;
    const max = Math.max(1, ...stats.acceptedPerDay.values());

    for (let i = 0; i < total; i++) {
        const day = start + i * DAY_MS;
        const cell = el('i');
        if (day < firstDay) {
            cell.classList.add('future');
        } else {
            const count = stats.acceptedPerDay.get(dayKey(day)) || 0;
            cell.dataset.level = String(count === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 4)));
            cell.title = `${new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${count} accepted`;
            if (day === todayStart) cell.classList.add('today');
        }
        heatmap.appendChild(cell);
    }
    setText('heatmap-meta', `${stats.acceptedPerDay.size ? [...stats.acceptedPerDay.values()].reduce((a, b) => a + b, 0) : 0} accepted submissions`);
}

function renderWeekly(records: SubmissionRecord[], rangeDays: number) {
    const chart = document.getElementById('weekly-chart') as HTMLElement;
    chart.textContent = '';
    const weeks = Math.min(26, Math.max(4, Math.ceil((rangeDays || 365) / 7)));
    const todayStart = startOfDay(Date.now());
    const weekStart = todayStart - new Date(todayStart).getDay() * DAY_MS;

    const counts: Array<{ start: number; slugs: Set<string> }> = [];
    for (let w = weeks - 1; w >= 0; w--) {
        counts.push({ start: weekStart - w * 7 * DAY_MS, slugs: new Set() });
    }
    records.filter((r) => r.accepted).forEach((r) => {
        const index = counts.findIndex((c) => r.at >= c.start && r.at < c.start + 7 * DAY_MS);
        if (index >= 0) counts[index].slugs.add(r.slug);
    });
    const max = Math.max(1, ...counts.map((c) => c.slugs.size));

    counts.forEach((c, i) => {
        const bar = el('div', 'bar');
        const value = el('span', 'bar-value', c.slugs.size ? String(c.slugs.size) : '');
        const fill = el('div', 'bar-fill');
        fill.style.height = `${(c.slugs.size / max) * 100}%`;
        const showLabel = weeks <= 8 || i % Math.ceil(weeks / 6) === 0 || i === weeks - 1;
        const label = el('span', 'bar-label', showLabel ? new Date(c.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
        bar.title = `Week of ${new Date(c.start).toLocaleDateString()}: ${c.slugs.size} solved`;
        bar.append(value, fill, label);
        chart.appendChild(bar);
    });
    const total = counts.reduce((sum, c) => sum + c.slugs.size, 0);
    setText('weekly-meta', `${(total / weeks).toFixed(1)} per week avg`);
}

function renderList(containerId: string, entries: Array<[string, number]>, emptyNote: string, classFor?: (name: string) => string) {
    const container = document.getElementById(containerId) as HTMLElement;
    container.textContent = '';
    if (!entries.length) {
        container.appendChild(el('p', 'note', emptyNote));
        return;
    }
    const max = Math.max(1, ...entries.map(([, n]) => n));
    entries.forEach(([name, count]) => {
        const row = el('div', 'hrow');
        const label = el('span', 'hrow-name', name);
        if (classFor) label.classList.add(classFor(name));
        const track = el('div', 'hrow-track');
        const fill = el('div', 'hrow-fill');
        fill.style.width = `${(count / max) * 100}%`;
        track.appendChild(fill);
        row.append(label, track, el('span', 'hrow-value', String(count)));
        row.title = `${name}: ${count}`;
        container.appendChild(row);
    });
}

function renderBreakdowns(records: SubmissionRecord[]) {
    const stats = computeStats(records);
    renderList('difficulty-list', Object.entries(stats.byDifficulty), 'No solves in this range.', (name) => `diff-${name}`);
    setText('difficulty-meta', `${stats.totalSolved} unique problems`);

    const langs = new Map<string, number>();
    records.filter((r) => r.accepted).forEach((r) => langs.set(r.lang || 'unknown', (langs.get(r.lang || 'unknown') || 0) + 1));
    renderList('language-list', [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8), 'No accepted submissions in this range.');

    const topics = new Map<string, Set<string>>();
    records.filter((r) => r.accepted && r.tags?.length).forEach((r) => {
        r.tags.forEach((tag) => {
            if (!topics.has(tag)) topics.set(tag, new Set());
            (topics.get(tag) as Set<string>).add(r.slug);
        });
    });
    renderList(
        'topic-list',
        [...topics.entries()].map(([t, s]) => [t, s.size] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 10),
        'Topics appear here for problems solved while the extension is running.'
    );
}

function renderTables(records: SubmissionRecord[]) {
    const stats = computeStats(records);
    const retryBody = document.querySelector('#retry-table tbody') as HTMLElement;
    retryBody.textContent = '';
    const bySlug = new Map(records.map((r) => [r.slug, r]));
    if (!stats.retry.length) {
        const row = el('tr');
        const cell = el('td', undefined, 'Nothing outstanding.');
        cell.colSpan = 4;
        row.appendChild(cell);
        retryBody.appendChild(row);
    }
    stats.retry.forEach((item) => {
        const record = bySlug.get(item.slug);
        const row = el('tr');
        const problem = el('td', 'problem');
        const link = el('a', undefined, item.title);
        link.href = `https://leetcode.com/problems/${item.slug}/`;
        link.target = '_blank';
        problem.appendChild(link);
        const difficulty = el('td', record?.difficulty ? `diff-${record.difficulty}` : undefined, record?.difficulty || '');
        const failed = el('td', 'num', String(item.attempts));
        const last = el('td', undefined, relativeTime((item as { last?: number }).last || 0));
        row.append(problem, difficulty, failed, last);
        retryBody.appendChild(row);
    });

    const recentBody = document.querySelector('#recent-table tbody') as HTMLElement;
    recentBody.textContent = '';
    [...records].sort((a, b) => b.at - a.at).slice(0, 25).forEach((r) => {
        const row = el('tr');
        const problem = el('td', 'problem');
        const link = el('a', undefined, r.title);
        link.href = `https://leetcode.com/problems/${r.slug}/`;
        link.target = '_blank';
        problem.appendChild(link);
        const result = el('td');
        result.appendChild(el('span', `result${r.accepted ? ' ok' : ''}`, r.status));
        row.append(problem, result, el('td', undefined, r.lang), el('td', undefined, relativeTime(r.at)));
        recentBody.appendChild(row);
    });
}

function render() {
    const rangeDays = parseInt((document.getElementById('range-select') as HTMLSelectElement).value);
    const records = inRange(allRecords, rangeDays);
    document.getElementById('empty-state')?.classList.toggle('hidden', allRecords.length > 0);
    renderTiles(records, rangeDays);
    renderHeatmap(records, rangeDays);
    renderWeekly(records, rangeDays);
    renderBreakdowns(records);
    renderTables(records);
}

/* ---------------- Init ---------------- */

async function main() {
    const { isDarkTheme } = await chrome.storage.local.get('isDarkTheme');
    document.documentElement.setAttribute('data-theme', isDarkTheme === false ? 'light' : 'dark');

    (document.getElementById('theme-btn') as HTMLButtonElement).onclick = () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('leetcode-explained-theme', next);
    };

    (document.getElementById('range-select') as HTMLSelectElement).onchange = render;

    (document.getElementById('export-btn') as HTMLButtonElement).onclick = () => {
        const blob = new Blob([JSON.stringify(allRecords, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leetcode-submissions-${dayKey(Date.now())}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    allRecords = await loadSubmissions();
    render();

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.submissions) {
            allRecords = Object.values(changes.submissions.newValue || {});
            render();
        }
    });
}

main();
