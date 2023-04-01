import json
import googleapiclient.discovery


def load_json_from_file(file_name):
    with open(file_name, "r") as f:
        data = json.load(f)
    return data


def save_json_to_file(file_name, data):
    with open(file_name, "w") as f:
        json.dump(data, f, indent=4)


def search_video_on_youtube(query, api_key):
    youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)

    request = youtube.search().list(
        part="id,snippet",
        type="video",
        q=query,
        videoDefinition="any",
        maxResults=5,
        fields="items(id(videoId),snippet(channelTitle,publishedAt))",
    )
    response = request.execute()

    for item in response["items"]:
        if "NeetCode" in item["snippet"]["channelTitle"]:
            return f"https://www.youtube.com/embed/{item['id']['videoId']}"
    return None


def main():
    api_key = "AIzaSyDUq5MsU-i0xG4y7K4bSrLUazK2rO_D6fg"
    leetcode_problems_file = "output.json"
    output_file = "output2.json"

    leetcode_problems = load_json_from_file(leetcode_problems_file)

    api_calls = 0
    for question in leetcode_problems["questions"]:
        if api_calls >= 20:
            break

        if question.get("channel") and question["channel"] != "NeetCode":
            new_embedded_url = search_video_on_youtube(question["title"], api_key)
            print("title:" + question["title"])
            api_calls += 1
            question["embedded_url"] = new_embedded_url
            question["channel"] = "NeetCode"

    save_json_to_file(output_file, leetcode_problems)


if __name__ == "__main__":
    main()
