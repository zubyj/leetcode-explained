import json


def load_titles_from_json(file_name):
    with open(file_name, "r") as f:
        titles = json.load(f)
    return titles


def save_titles_to_json(file_name, titles):
    with open(file_name, "w") as f:
        json.dump(titles, f, indent=4)


def filter_titles(titles):
    filtered_titles = [title for title in titles if "leetcode" in title.lower()]
    return filtered_titles


def main():
    json_file_name = "video_titles.json"
    titles = load_titles_from_json(json_file_name)
    filtered_titles = filter_titles(titles)
    save_titles_to_json(json_file_name, filtered_titles)


if __name__ == "__main__":
    main()
