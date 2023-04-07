import json

# Load the video titles and leetcode problems JSON files
with open("video_titles_neetcodeio.json") as f:
    video_titles = json.load(f)

with open("leetcode_problems.json") as f:
    leetcode_problems = json.load(f)

# Loop through each video title
for title in video_titles:
    # Extract the problem name from the video title
    problem_name = title.split(" - ")[0]

    # Search for the problem in the leetcode problems JSON file
    problem = next(
        (p for p in leetcode_problems["questions"] if p["title"] == problem_name), None
    )

    # If the problem is not found, print the video title
    if problem is None:
        print(title)
