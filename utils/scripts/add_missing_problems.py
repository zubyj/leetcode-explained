import json
import requests

# Load the leetcode_problems.json file
with open("leetcode_problems.json") as f:
    data = json.load(f)

# Define the YouTube Data API endpoint and parameters
url = "https://www.googleapis.com/youtube/v3/search"
params = {
    "part": "snippet",
    "maxResults": 20,
    "q": "",
    "type": "video",
    "key": "AIzaSyDUq5MsU-i0xG4y7K4bSrLUazK2rO_D6fg",
}

# Define a function to extract the problem number from the title
def extract_number(title):
    # Search for the substring "Leetcode" in the title
    index = title.find("Leetcode")
    if index == -1:
        return None

    # Extract the digits immediately preceding the substring
    number_str = ""
    for i in range(index - 1, -1, -1):
        if title[i].isdigit():
            number_str = title[i] + number_str
        else:
            break

    # Convert the extracted string to an integer
    return int(number_str) if number_str else None


# Define a flag variable to keep track of whether a match was found
match_found = False

# Loop through each title and search for it on YouTube
titles = [
    "Binary Tree Postorder Traversal (Iterative) - Leetcode 145 - Python",
    "Binary Tree Preorder Traversal (Iterative) - Leetcode 144 - Python",
    "Longest Turbulent Array - Leetcode 978 - Python",
    "Capacity to Ship Packages - Leetcode 1011 - Python",
    "Range Sum Query Immutable - Leetcode 303 - Python",
    "Design Hashmap - Leetcode 706 - Python",
    "Minimum Distance between BST Nodes - Leetcode 783 - Python",
    "Number of Subarrays of size K and Average Greater than or Equal to Threshold - Leetcode 1343 Python",
    "Fruits into Basket - Leetcode 904 - Python",
    "Shuffle the Array (Constant Space) - Leetcode 1470 - Python",
    "Shortest Path in a Binary Matrix - Leetcode 1091 - Python",
    "Best Team with no Conflicts - Leetcode 1626 - Python",
]
for title in titles:
    # Extract the problem number from the title
    number = extract_number(title)

    # Search for the title on YouTube
    params["q"] = title
    response = requests.get(url, params=params).json()

    # Loop through the search results and check for a match
    for item in response["items"]:
        if "NeetCodeIO" in item["snippet"]["channelTitle"]:
            # Check if a match was found in the leetcode_problems.json file
            for question in data["questions"]:
                if question["frontend_id"] == number:
                    if (
                        "embedded_url" not in question
                        and "NeetCodeIO" in item["snippet"]["channelTitle"]
                    ):
                        # Insert the channel and embedded_url into the json
                        question["channel"] = item["snippet"]["channelTitle"]
                        question["embedded_url"] = (
                            "https://www.youtube.com/embed/" + item["id"]["videoId"]
                        )

                        # Log the channel name and problem title in the console.log
                        print("Channel:", item["snippet"]["channelTitle"])
                        print("Problem Title:", title)
                        match_found = True
                        break
            else:
                print("No match found for", title)
            # Check if a match was found
            if match_found:
                break
    with open("leetcode_problems.json", "w") as f:
        json.dump(data, f)
