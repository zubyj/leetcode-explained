import json

# Load the JSON object from the input file
with open("problems.json", "r") as f:
    data = json.load(f)

# Extract the list of question titles, IDs, and frontend IDs
questions = []
for item in data["stat_status_pairs"]:
    title = item["stat"]["question__title"]
    id = item["stat"]["question_id"]
    frontend_id = item["stat"]["frontend_question_id"]
    questions.append({"title": title, "id": id, "frontend_id": frontend_id})

# Create a new JSON object with the list of questions
output = {"questions": questions}

# Write the output to a new file
with open("output.json", "w") as f:
    json.dump(output, f)
