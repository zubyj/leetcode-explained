#!/usr/bin/env python3
"""
Rebuilds the company data from liquidslr/leetcode-company-wise-problems
(https://github.com/liquidslr/leetcode-company-wise-problems), which tracks
LeetCode's premium company tags with frequency and recency windows.

Updates in place:
  src/assets/data/problems_by_company.json   {Company: [{title, slug, id, rank, frequency, recent}]}
  src/assets/data/problem_data.json          each question's "slug" and "companies": [{name, score, recent}];
                                             problems newer than the dataset are appended from LeetCode's list

Everything is joined on the LeetCode URL slug, not the title: titles get renamed
and the dataset's "Link" column (and the extension's page lookup) use the slug.

Usage: python3 scripts/refresh_companies.py [--top 50] [--min-problems 5]
"""
import argparse
import csv
import io
import json
import os
import sys
import tarfile
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'src', 'assets', 'data')
TARBALL = 'https://github.com/liquidslr/leetcode-company-wise-problems/archive/refs/heads/main.tar.gz'
LEETCODE_PROBLEMS = 'https://leetcode.com/api/problems/all/'
ALL_FILE = '5. All.csv'
RECENT_FILE = '3. Six Months.csv'


def download_repo():
    print('Downloading dataset ...', file=sys.stderr)
    with urllib.request.urlopen(TARBALL, timeout=120) as response:
        return tarfile.open(fileobj=io.BytesIO(response.read()), mode='r:gz')


def download_leetcode_problems():
    """Returns {slug: stat} for every problem on LeetCode."""
    print('Downloading LeetCode problem list ...', file=sys.stderr)
    request = urllib.request.Request(LEETCODE_PROBLEMS, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=120) as response:
        pairs = json.load(response)['stat_status_pairs']
    problems = {}
    for pair in pairs:
        stat = pair['stat']
        problems[stat['question__title_slug']] = {
            'title': stat['question__title'],
            'id': stat['question_id'],
            'frontend_id': stat['frontend_question_id'],
            'difficulty_lvl': pair['difficulty']['level'],
            'acceptance': round(stat['total_acs'] / stat['total_submitted'], 5) if stat['total_submitted'] else 0,
        }
    return problems


def sync_problem_list(questions, leetcode):
    """Adds "slug" to every question and appends problems the dataset is missing."""
    slug_by_frontend_id = {p['frontend_id']: slug for slug, p in leetcode.items()}
    for question in questions:
        slug = slug_by_frontend_id.get(question['frontend_id'])
        if slug:
            question['slug'] = slug
    known = {q.get('slug') for q in questions}
    added = 0
    for slug, p in sorted(leetcode.items(), key=lambda item: item[1]['frontend_id']):
        if slug not in known:
            questions.append({'title': p['title'], 'slug': slug, 'id': p['id'], 'frontend_id': p['frontend_id'],
                              'difficulty_lvl': p['difficulty_lvl'], 'acceptance': p['acceptance']})
            added += 1
    questions.sort(key=lambda q: q['frontend_id'])
    print(f'{added} new problems added from LeetCode', file=sys.stderr)


def slug_from_link(link):
    return link.rstrip('/').rsplit('/', 1)[-1]


def read_csv(tar, member):
    text = tar.extractfile(member).read().decode('utf-8')
    return list(csv.DictReader(io.StringIO(text)))


def load_company_tables(tar):
    """Returns {company: {'all': rows, 'recent': set(slugs)}}."""
    companies = {}
    for member in tar.getmembers():
        parts = member.name.split('/')
        if len(parts) != 3 or not member.isfile():
            continue
        _, company, filename = parts
        entry = companies.setdefault(company, {'all': [], 'recent': set()})
        if filename == ALL_FILE:
            entry['all'] = read_csv(tar, member)
        elif filename == RECENT_FILE:
            entry['recent'] = {slug_from_link(row['Link']) for row in read_csv(tar, member)}
    return {name: data for name, data in companies.items() if data['all']}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--top', type=int, default=50, help='problems kept per company')
    parser.add_argument('--min-problems', type=int, default=5, help='drop companies with fewer tagged problems')
    parser.add_argument('--companies-per-problem', type=int, default=10)
    args = parser.parse_args()

    problem_path = os.path.join(DATA_DIR, 'problem_data.json')
    with open(problem_path) as f:
        problem_data = json.load(f)
    questions = problem_data['questions']
    sync_problem_list(questions, download_leetcode_problems())
    question_by_slug = {q['slug']: q for q in questions if q.get('slug')}

    tables = load_company_tables(download_repo())
    print(f'{len(tables)} companies in dataset', file=sys.stderr)

    by_company = {}
    scores_by_slug = {}
    for company, data in sorted(tables.items()):
        rows = sorted(data['all'], key=lambda r: -float(r['Frequency'] or 0))
        if len(rows) < args.min_problems:
            continue
        kept = []
        for rank, row in enumerate(rows, start=1):
            slug = slug_from_link(row['Link'])
            question = question_by_slug.get(slug)
            frequency = round(float(row['Frequency'] or 0), 1)
            recent = slug in data['recent']
            scores_by_slug.setdefault(slug, []).append((company, frequency, recent))
            if rank <= args.top:
                kept.append({
                    'title': question['title'] if question else row['Title'],
                    'slug': slug,
                    'id': question['frontend_id'] if question else 0,
                    'rank': rank,
                    'frequency': frequency,
                    'recent': recent,
                })
        by_company[company] = kept

    for question in questions:
        scores = sorted(scores_by_slug.get(question.get('slug'), []), key=lambda s: -s[1])
        question['companies'] = [{'name': name, 'score': score, 'recent': recent} for name, score, recent in scores[:args.companies_per_problem]]

    with open(os.path.join(DATA_DIR, 'problems_by_company.json'), 'w') as f:
        json.dump(by_company, f, indent=4)
    with open(problem_path, 'w') as f:
        json.dump(problem_data, f, indent=4)

    tagged = sum(1 for q in questions if q['companies'])
    print(f'wrote {len(by_company)} companies; {tagged}/{len(questions)} problems have company tags', file=sys.stderr)


if __name__ == '__main__':
    main()
