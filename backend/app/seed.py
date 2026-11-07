# This is where the cybersecurity challenges will be implemented
# and inserts them into the SQLite database.

import json # reads and writes JSON data.
from pathlib import Path 
from app.db import get_connection, init_db # connects to the database and initializes it if it doesn't exist.

# Locate the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Locate the JSON file
CHALLENGES_PATH = BASE_DIR / "content" / "night1_challenges.json"
# BASE_DIR finds backend folder
# CHALLENGES_PATH finds the JSON file in the content folder

#json.load(file) reads the JSON file and converts it into a Python dictionary.
def load_challenges():
    # Open the JSON file
    with open(CHALLENGES_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data


if __name__ == "__main__":
    data = load_challenges()

    print("Challenge pack:", data["pack_id"])
    print("Number of challenges:", len(data["challenges"]))