import json
import re


def load_json_from_file(file_name):
    with open(file_name, "r") as f:
        data = json.load(f)
    return data


def save_json_to_file(file_name, data):
    with open(file_name, "w") as f:
        json.dump(data, f, indent=4)


def find_frontend_id_in_title(frontend_id, titles):
    pattern = f"\\b{frontend_id}\\b"
    for title in titles:
        if re.search(pattern, title):
            return True
    return False


def main():
    video_titles_file = "video_titles.json"
    leetcode_problems_file = "leetcode_problems.json"
    output_file = "output.json"

    video_titles = load_json_from_file(video_titles_file)
    leetcode_problems = load_json_from_file(leetcode_problems_file)

    for question in leetcode_problems["questions"]:
        frontend_id = question["frontend_id"]
        if find_frontend_id_in_title(frontend_id, video_titles):
            question["embedded_url"] = question.get("embedded_url")
            question["channel"] = question.get("channel", "NeetCode")
        else:
            question.pop("embedded_url", None)
            question.pop("channel", None)

    save_json_to_file(output_file, leetcode_problems)


if __name__ == "__main__":
    main()
