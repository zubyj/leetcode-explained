import json
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Enter your API key here
DEVELOPER_KEY = "AIzaSyDUq5MsU-i0xG4y7K4bSrLUazK2rO_D6fg"
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

# Load the JSON file
with open("leetcode_problems.json") as f:
    data = json.load(f)

# Get the index of the last processed question
last_index = -1
for i, question in enumerate(data["questions"]):
    if "embedded_url" in question:
        last_index = i

# Process the next 10 questions that haven't already had the embedded URL property inserted
for question in data["questions"][last_index + 1 : last_index + 21]:
    # Check if the embedded_url property already exists
    if "embedded_url" in question:
        continue

    # Search for the title on YouTube
    youtube = build(
        YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=DEVELOPER_KEY
    )
    search_response = (
        youtube.search()
        .list(
            q=f"{question['frontend_id']} {question['title']} leetcode",
            type="video",
            part="id,snippet",
            maxResults=5,
        )
        .execute()
    )

    # Find the first video with a channel name of "Neetcode"
    video_id = None
    for search_result in search_response.get("items", []):
        if search_result["snippet"]["channelTitle"] == "NeetCodeIO":
            video_id = search_result["id"]["videoId"]
            break

    # If no "Neetcode" video is found, use the first search result
    if not video_id and search_response.get("items"):
        video_id = search_response["items"][0]["id"]["videoId"]

    # Get the embedded video URL
    if video_id:
        embedded_url = f"https://www.youtube.com/embed/{video_id}"
        print(
            "Found video for {}".format(question["title"])
            + " from channel "
            + search_result["snippet"]["channelTitle"]
        )
        question["embedded_url"] = embedded_url
        question["channel"] = search_result["snippet"]["channelTitle"]

# Save the updated JSON file
with open("leetcode_problems.json", "w") as f:
    json.dump(data, f)
