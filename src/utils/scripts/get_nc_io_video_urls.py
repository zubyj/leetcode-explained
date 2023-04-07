import json
import re
import requests

# Load JSON data
with open("leetcode_problems.json", "r") as f:
    leetcode_problems = json.load(f)

with open("video_titles_neetcodeio.json", "r") as f:
    video_titles = json.load(f)

# Extract the problem title from video titles
problem_titles = [re.sub(r" - Leetcode.*", "", title) for title in video_titles]

# Your YouTube Data API key
api_key = "AIzaSyDUq5MsU-i0xG4y7K4bSrLUazK2rO_D6fg"

# Iterate over the extracted problem titles
for problem_title in problem_titles:
    # Search for the problem in leetcode_problems.json
    for problem in leetcode_problems["questions"]:
        if problem["title"] == problem_title and "embedded_url" not in problem:
            # Call the YouTube Data API to search for the video using the problem title
            search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q={problem_title}&type=video&key={api_key}"
            response = requests.get(search_url)
            search_results = response.json()

            # Check if the NeetcodeIO channel is among the top 5 results
            solution_found = False
            for item in search_results["items"]:
                if item["snippet"]["channelTitle"] == "NeetCodeIO":
                    video_id = item["id"]["videoId"]
                    channel_name = item["snippet"]["channelTitle"]
                    embedded_url = f"https://www.youtube.com/embed/{video_id}"

                    problem["channel"] = channel_name
                    problem["embedded_url"] = embedded_url

                    # Log the embedded_url and channel name
                    print(f"Problem: {problem_title}")
                    print(f"Channel: {channel_name}")
                    print(f"Embedded URL: {embedded_url}\n")

                    solution_found = True
                    break

            if not solution_found:
                print(f"Problem: {problem_title}")
                print("A solution was not found in the top 5 results\n")

# Save the updated JSON data to leetcode_problems.json
with open("leetcode_problems.json", "w") as f:
    json.dump(leetcode_problems, f, indent=4)
