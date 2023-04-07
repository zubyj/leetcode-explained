import os
import googleapiclient.discovery
import googleapiclient.errors
import json


def load_existing_titles(file_name):
    try:
        with open(file_name, "r") as f:
            existing_titles = json.load(f)
    except FileNotFoundError:
        existing_titles = []

    return existing_titles


def get_channel_videos(channel_id, existing_titles):
    youtube = googleapiclient.discovery.build(
        "youtube", "v3", developerKey="AIzaSyAS0QBURaHB5lKC2syj_dSB1EBL1Ty943Q"
    )
    new_titles = []
    next_page_token = None

    while True:
        request = youtube.search().list(
            part="snippet",
            channelId=channel_id,
            maxResults=50,
            order="date",
            type="video",
            pageToken=next_page_token,
        )
        response = request.execute()
        for item in response["items"]:
            title = item["snippet"]["title"]
            if title not in existing_titles:
                new_titles.append(title)

        next_page_token = response.get("nextPageToken")
        if not next_page_token or len(new_titles) >= 50:
            break

    return new_titles


def save_titles_to_json(file_name, titles):
    with open(file_name, "w") as f:
        json.dump(titles, f, indent=4)


def main():
    neetcode_channel_id = "UCevUmOfLTUX9MNGJQKsPdIA"
    json_file_name = "video_titles_neetcodeio.json"
    existing_titles = load_existing_titles(json_file_name)
    new_titles = get_channel_videos(neetcode_channel_id, existing_titles)
    all_titles = existing_titles + new_titles
    save_titles_to_json(json_file_name, all_titles)


if __name__ == "__main__":
    main()
