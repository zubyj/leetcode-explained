import json
import math


def round_scores():
    # Load the data from JSON file
    with open("leetcode_solutions.json", "r") as f:
        data = json.load(f)

    # Iterate over the questions
    for question in data.get("questions", []):
        # Check if the question has 'companies' field
        if "companies" in question:
            # Iterate over the companies
            for company in question["companies"]:
                # Check if the company has 'score' field
                if "score" in company:
                    # Round the score to the nearest whole number
                    company["score"] = round(company["score"])

    # Write the output to a new JSON file
    with open("leetcode_solutions_rounded.json", "w") as f:
        json.dump(data, f, indent=4)


# Run the function
round_scores()
