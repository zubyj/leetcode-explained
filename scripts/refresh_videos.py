#!/usr/bin/env python3
"""
Refreshes the YouTube explanation videos using the official YouTube Data API
v3 (search.list). Scraping YouTube is against its Terms of Service, so this is
the only sanctioned way to discover videos.

Constraints this script is built around (developers.google.com/youtube/terms):
  - A project gets 100 search.list calls per day by default, so each run does
    a small batch (default 30) and the data is refreshed on a rolling basis.
  - Public API data may be kept for at most 30 days, so problems are refreshed
    oldest-first and each entry records when it was fetched. Keep the batch
    running daily (cron) so the ~1,000 most popular problems cycle within
    30 days: 1000 / 30 = 34 searches a day.

One search per problem: "<title> leetcode", 10 results, NeetCode pinned first
when present, otherwise YouTube's relevance order, one video per channel.

Setup: export YOUTUBE_API_KEY=... (Google Cloud project with YouTube Data API v3)

Usage:
  python3 scripts/refresh_videos.py                 # next batch of 30
  python3 scripts/refresh_videos.py --batch 60
  python3 scripts/refresh_videos.py --only "Two Sum"
  python3 scripts/refresh_videos.py --status
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, 'src', 'assets', 'data', 'problem_data.json')
API_URL = 'https://www.googleapis.com/youtube/v3/search'
NEETCODE_CHANNELS = {'neetcode', 'neetcodeio'}
MAX_VIDEOS = 5
REFRESH_AFTER_DAYS = 30


def normalized(text):
    return re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()


def mentions_problem(video_title, problem_title):
    words = [w for w in normalized(problem_title).split() if len(w) > 2]
    return all(w in normalized(video_title) for w in words[:4]) if words else False


def search(api_key, query):
    params = urllib.parse.urlencode({
        'part': 'snippet',
        'type': 'video',
        'videoEmbeddable': 'true',
        'safeSearch': 'strict',
        'maxResults': 10,
        'q': query,
        'key': api_key,
    })
    with urllib.request.urlopen(f'{API_URL}?{params}', timeout=30) as response:
        payload = json.load(response)
    return [{
        'id': item['id']['videoId'],
        'title': item['snippet']['title'],
        'channel': item['snippet']['channelTitle'],
    } for item in payload.get('items', []) if item.get('id', {}).get('videoId')]


def choose_videos(results, problem_title):
    relevant = [v for v in results if mentions_problem(v['title'], problem_title)]
    neetcode = [v for v in relevant if normalized(v['channel']).replace(' ', '') in NEETCODE_CHANNELS]
    candidates = neetcode[:1] + relevant + results

    ordered = []
    seen = set()
    # One video per channel first, so five slots mean five creators.
    for allow_repeat in (False, True):
        for video in candidates:
            if video['id'] in seen or len(ordered) == MAX_VIDEOS:
                continue
            if not allow_repeat and any(v['channel'] == video['channel'] for v in ordered):
                continue
            seen.add(video['id'])
            ordered.append(video)
    return [{'embedded_url': f"https://www.youtube.com/embed/{v['id']}", 'channel': v['channel']} for v in ordered]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch', type=int, default=30, help='problems to refresh this run (100 searches/day quota)')
    parser.add_argument('--top', type=int, default=1000, help='only maintain the N most popular problems')
    parser.add_argument('--only', help='refresh a single problem by exact title')
    parser.add_argument('--status', action='store_true')
    args = parser.parse_args()

    api_key = os.environ.get('YOUTUBE_API_KEY')
    if not api_key and not args.status:
        sys.exit('Set YOUTUBE_API_KEY (YouTube Data API v3 key from Google Cloud).')

    with open(DATA_PATH) as f:
        data = json.load(f)
    questions = data['questions']

    def popularity(q):
        return sum(c.get('score', 0) for c in q.get('companies', []))

    def refreshed_at(q):
        return q.get('videos_refreshed_at', 0)

    popular = sorted(questions, key=popularity, reverse=True)[:args.top]
    stale_cutoff = time.time() - REFRESH_AFTER_DAYS * 86400
    stale = [q for q in popular if refreshed_at(q) < stale_cutoff]
    print(f'{len(popular) - len(stale)}/{len(popular)} popular problems refreshed within {REFRESH_AFTER_DAYS} days; {len(stale)} stale', file=sys.stderr)
    if args.status:
        return

    todo = [q for q in questions if q['title'] == args.only] if args.only else sorted(stale, key=refreshed_at)[:args.batch]
    for index, question in enumerate(todo, start=1):
        title = question['title']
        try:
            videos = choose_videos(search(api_key, f'{title} leetcode'), title)
        except Exception as error:
            print(f'  ! {title}: {error}', file=sys.stderr)
            if 'quota' in str(error).lower() or '403' in str(error):
                break
            continue
        if videos:
            question['videos'] = videos
        question['videos_refreshed_at'] = int(time.time())
        with open(DATA_PATH, 'w') as f:
            json.dump(data, f, indent=4)
        print(f'[{index}/{len(todo)}] {title}: {", ".join(v["channel"] for v in videos) or "no videos"}', file=sys.stderr)


if __name__ == '__main__':
    main()
