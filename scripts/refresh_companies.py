#!/usr/bin/env python3
"""
Rebuilds the company data from liquidslr/leetcode-company-wise-problems
(https://github.com/liquidslr/leetcode-company-wise-problems), which tracks
LeetCode's premium company tags with frequency and recency windows.

Updates in place:
  src/assets/data/problems_by_company.json   {Company: [{title, id, rank, frequency, recent}]}
  src/assets/data/problem_data.json          each question's "companies": [{name, score}]

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
ALL_FILE = '5. All.csv'
RECENT_FILE = '3. Six Months.csv'


def download_repo():
    print('Downloading dataset ...', file=sys.stderr)
    with urllib.request.urlopen(TARBALL, timeout=120) as response:
        return tarfile.open(fileobj=io.BytesIO(response.read()), mode='r:gz')


def read_csv(tar, member):
    text = tar.extractfile(member).read().decode('utf-8')
    return list(csv.DictReader(io.StringIO(text)))


def load_company_tables(tar):
    """Returns {company: {'all': rows, 'recent': set(titles)}}."""
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
            entry['recent'] = {row['Title'] for row in read_csv(tar, member)}
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
    id_by_title = {q['title']: q['frontend_id'] for q in questions}

    tables = load_company_tables(download_repo())
    print(f'{len(tables)} companies in dataset', file=sys.stderr)

    by_company = {}
    scores_by_title = {}
    for company, data in sorted(tables.items()):
        rows = sorted(data['all'], key=lambda r: -float(r['Frequency'] or 0))
        if len(rows) < args.min_problems:
            continue
        kept = []
        for rank, row in enumerate(rows, start=1):
            title = row['Title']
            frequency = round(float(row['Frequency'] or 0), 1)
            scores_by_title.setdefault(title, []).append((company, frequency, title in data['recent']))
            if rank <= args.top:
                kept.append({
                    'title': title,
                    'id': id_by_title.get(title, 0),
                    'rank': rank,
                    'frequency': frequency,
                    'recent': title in data['recent'],
                })
        by_company[company] = kept

    for question in questions:
        scores = sorted(scores_by_title.get(question['title'], []), key=lambda s: -s[1])
        question['companies'] = [{'name': name, 'score': score, 'recent': recent} for name, score, recent in scores[:args.companies_per_problem]]

    with open(os.path.join(DATA_DIR, 'problems_by_company.json'), 'w') as f:
        json.dump(by_company, f, indent=4)
    with open(problem_path, 'w') as f:
        json.dump(problem_data, f, indent=4)

    tagged = sum(1 for q in questions if q['companies'])
    print(f'wrote {len(by_company)} companies; {tagged}/{len(questions)} problems have company tags', file=sys.stderr)


if __name__ == '__main__':
    main()
