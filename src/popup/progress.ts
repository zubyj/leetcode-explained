/*
 * Progress view: reads the submissions recorded by the content script and
 * renders solve counts, a 30-day activity grid, a difficulty split, and the
 * problems with the most recent failed attempts.
 */

export interface SubmissionRecord {
    id: number;
    slug: string;
    title: string;
    difficulty: string;
    tags: string[];
    lang: string;
    status: string;
    accepted: boolean;
    at: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ms: number): number {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function dayKey(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

function uniqueSlugs(records: SubmissionRecord[]): Set<string> {
    return new Set(records.map((r) => r.slug));
}

interface ProgressStats {
    solvedToday: number;
    solvedWeek: number;
    solvedMonth: number;
    streak: number;
    totalSolved: number;
    byDifficulty: Record<string, number>;
    acceptedPerDay: Map<string, number>;
    retry: Array<{ slug: string; title: string; attempts: number }>;
}

export function computeStats(records: SubmissionRecord[], now = Date.now()): ProgressStats {
    const accepted = records.filter((r) => r.accepted);
    const today = startOfDay(now);

    const acceptedPerDay = new Map<string, number>();
    const solvedDays = new Set<string>();
    accepted.forEach((r) => {
        const key = dayKey(startOfDay(r.at));
        acceptedPerDay.set(key, (acceptedPerDay.get(key) || 0) + 1);
        solvedDays.add(key);
    });

    // Streak counts back from today, or from yesterday if today is still empty.
    let streak = 0;
    let cursor = solvedDays.has(dayKey(today)) ? today : today - DAY_MS;
    while (solvedDays.has(dayKey(cursor))) {
        streak++;
        cursor -= DAY_MS;
    }

    const firstSolveBySlug = new Map<string, SubmissionRecord>();
    accepted.forEach((r) => {
        const existing = firstSolveBySlug.get(r.slug);
        if (!existing || r.at < existing.at) firstSolveBySlug.set(r.slug, r);
    });
    const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    firstSolveBySlug.forEach((r) => {
        if (r.difficulty in byDifficulty) byDifficulty[r.difficulty]++;
    });

    // Failed attempts in the last 30 days on problems not accepted since.
    const monthAgo = now - 30 * DAY_MS;
    const lastAcceptBySlug = new Map<string, number>();
    accepted.forEach((r) => lastAcceptBySlug.set(r.slug, Math.max(r.at, lastAcceptBySlug.get(r.slug) || 0)));
    const failures = new Map<string, { title: string; attempts: number; last: number }>();
    records.filter((r) => !r.accepted && r.at >= monthAgo).forEach((r) => {
        if ((lastAcceptBySlug.get(r.slug) || 0) >= r.at) return;
        const entry = failures.get(r.slug) || { title: r.title, attempts: 0, last: 0 };
        entry.attempts++;
        entry.last = Math.max(entry.last, r.at);
        failures.set(r.slug, entry);
    });
    const retry = Array.from(failures.entries())
        .map(([slug, f]) => ({ slug, title: f.title, attempts: f.attempts, last: f.last }))
        .sort((a, b) => b.attempts - a.attempts || b.last - a.last)
        .slice(0, 5);

    return {
        solvedToday: uniqueSlugs(accepted.filter((r) => r.at >= today)).size,
        solvedWeek: uniqueSlugs(accepted.filter((r) => r.at >= today - 6 * DAY_MS)).size,
        solvedMonth: uniqueSlugs(accepted.filter((r) => r.at >= today - 29 * DAY_MS)).size,
        streak,
        totalSolved: firstSolveBySlug.size,
        byDifficulty,
        acceptedPerDay,
        retry,
    };
}

function setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

export function renderProgress(records: SubmissionRecord[]) {
    const stats = computeStats(records);
    const now = Date.now();

    setText('stat-today', String(stats.solvedToday));
    setText('stat-week', String(stats.solvedWeek));
    setText('stat-streak', String(stats.streak));
    setText('stat-month', `${stats.solvedMonth} solved`);
    setText('stat-total', `${stats.totalSolved} problems`);

    const grid = document.getElementById('activity-grid') as HTMLElement;
    grid.textContent = '';
    const todayStart = startOfDay(now);
    for (let i = 29; i >= 0; i--) {
        const day = todayStart - i * DAY_MS;
        const count = stats.acceptedPerDay.get(dayKey(day)) || 0;
        const cell = document.createElement('div');
        cell.classList.add('activity-cell');
        if (i === 0) cell.classList.add('today');
        cell.dataset.level = String(count === 0 ? 0 : Math.min(4, Math.ceil(count / 1.5)));
        const label = new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        cell.title = `${label}: ${count} accepted`;
        grid.appendChild(cell);
    }

    const bars = document.getElementById('difficulty-bars') as HTMLElement;
    bars.textContent = '';
    const max = Math.max(1, ...Object.values(stats.byDifficulty));
    Object.entries(stats.byDifficulty).forEach(([name, count]) => {
        const row = document.createElement('div');
        row.classList.add('difficulty-row');
        const label = document.createElement('span');
        label.classList.add('difficulty-name');
        label.textContent = name;
        const track = document.createElement('div');
        track.classList.add('difficulty-track');
        const fill = document.createElement('div');
        fill.classList.add('difficulty-fill');
        fill.style.width = `${(count / max) * 100}%`;
        track.appendChild(fill);
        const value = document.createElement('span');
        value.classList.add('difficulty-count');
        value.textContent = String(count);
        row.append(label, track, value);
        row.title = `${count} ${name.toLowerCase()} problems solved`;
        bars.appendChild(row);
    });

    const list = document.getElementById('retry-list') as HTMLElement;
    list.textContent = '';
    if (!stats.retry.length) {
        const note = document.createElement('li');
        note.classList.add('empty-note');
        note.textContent = records.length ? 'Nothing outstanding. Nice.' : 'Submit a problem on LeetCode, or import your history below.';
        list.appendChild(note);
    }
    stats.retry.forEach((item) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `https://leetcode.com/problems/${item.slug}/`;
        link.target = '_blank';
        link.textContent = item.title;
        const attempts = document.createElement('span');
        attempts.classList.add('retry-attempts');
        attempts.textContent = `${item.attempts} failed`;
        li.append(link, attempts);
        list.appendChild(li);
    });
}

export async function loadSubmissions(): Promise<SubmissionRecord[]> {
    const { submissions } = await chrome.storage.local.get('submissions');
    return Object.values((submissions || {}) as Record<string, SubmissionRecord>);
}
