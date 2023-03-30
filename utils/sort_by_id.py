import json

# Read the JSON file
with open("output.json", "r") as file:
    data = json.load(file)

# Sort the list of dictionaries in 'questions' by the 'id' key
sorted_questions = sorted(data["questions"], key=lambda x: x["id"])

# Update the 'questions' key with the sorted list
data["questions"] = sorted_questions

# Print the sorted data
print(data)

# Optionally, save the sorted data to a new JSON file
with open("sorted_output.json", "w") as output_file:
    json.dump(data, output_file, indent=2)
