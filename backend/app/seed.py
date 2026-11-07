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


def seed_challenges():
    # Step 1: Make sure the database tables exist
    init_db()

    # Step 2: Read the JSON challenge pack
    data = load_challenges()

    # Step 3: Connect to the SQLite database
    connection = get_connection()

    try:
        # Step 4: Loop through each challenge
        for challenge in data["challenges"]:

            # Insert the challenge into the database
            connection.execute("""
                INSERT OR REPLACE INTO challenges (
                    id,
                    pack_id,
                    night,
                    tier,
                    type,
                    is_malicious,
                    best_action,
                    data_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                challenge["id"],
                data["pack_id"],
                data["night"],
                challenge["tier"],
                challenge["type"],
                int(challenge["is_malicious"]),
                challenge["best_action"],
                json.dumps(challenge)   # converts the challenge dictionary into a JSON string before storing it in the database.
            ))

        # Step 5: Save changes
        connection.commit()

    finally:
        # Step 6: Close the database connection
        connection.close()

    print("Cybersecurity challenges inserted successfully!")


if __name__ == "__main__":
    seed_challenges()
    