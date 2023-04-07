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
    api_key = "AIzaSyAS0QBURaHB5lKC2syj_dSB1EBL1Ty943Q"
    output_file = "output.json"

    output_data = load_json_from_file(output_file)

    api_calls = 0

    for question in output_data["questions"]:

        if api_calls >= 20:
            break

        if question.get("channel") == "NeetCode" and question["embedded_url"] is None:
            print(
                f"Processing question: {question['title']}"
            )  # Log question name to the console

            api_calls += 1

            new_embedded_url = search_video_on_youtube(question["title"], api_key)

            if new_embedded_url:
                question["embedded_url"] = new_embedded_url
                print(
                    f"Inserted: Title: {question['title']} | Embedded URL: {new_embedded_url}"
                )

    save_json_to_file(output_file, output_data)


if __name__ == "__main__":
    main()
