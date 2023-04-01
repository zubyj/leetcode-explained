import json
import re
from googleapiclient.discovery import build

# Enter your API key here
API_KEY = "AIzaSyDYAAAT350LFmkXQRPh0swZTjBjt7Lye_k"

# Load the JSON file
with open("leetcode_problems.json") as f:
    data = json.load(f)

# Create a YouTube Data API client
youtube = build("youtube", "v3", developerKey=API_KEY)

# Loop through the questions and add the "channel" property if conditions are met
for question in data["questions"]:
    if "embedded_url" in question and question["embedded_url"] != "":
        # Extract the video ID from the "embedded_url" field using regex
        match = re.search(r"(?<=youtube\.com\/embed\/)[^\/]+", question["embedded_url"])
        if match:
            video_id = match.group(0)
            # Call the YouTube Data API to get the video details
            video_response = (
                youtube.videos().list(part="snippet", id=video_id).execute()
            )
            if video_response and len(video_response["items"]) > 0:
                # Extract the channel name from the video details
                channel_name = video_response["items"][0]["snippet"]["channelTitle"]
                question["channel"] = channel_name

# Write the updated JSON data to a file
with open("leetcode_problems_with_channel.json", "w") as f:
    json.dump(data, f, indent=4)
