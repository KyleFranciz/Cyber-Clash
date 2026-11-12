# this will retrieve phishing emails for the React frontend to display in the dashboard. It will also retrieve the number of phishing emails and the number of users in the database.
# will keep the private answer fields on the backend until player submits their answer.

import json
from app.db import get_connection


def get_challenge(challenge_id):
    # Connect to the SQLite database
    connection = get_connection()

    try:
        # Find the challenge using its ID
        
        # retrieve the challenge data from the database using the provided challenge_id. 
        # The query selects the data_json column from the challenges table where the id matches the given challenge_id. 
        # The result is fetched as a single row.
        row = connection.execute("""
            SELECT data_json
            FROM challenges
            WHERE id = ?
        """, (challenge_id,)).fetchone()

        # best_action, is_malicious, and data_json are stored in the database
        # but not returned to the frontend. 
        # Those remain private to the backend until the player submits their answer.
        
        # Return None if the challenge does not exist
        if row is None:
            return None

        # Convert JSON text into a Python dictionary
        challenge = json.loads(row["data_json"])

        # Return only information the player can see
        return {
            "id": challenge["id"],
            "type": challenge["type"],
            "tier": challenge["tier"],
            "email": challenge["email"]
        }

    finally:
        # Always close the connection
        connection.close()
        
def make_public_challenge(challenge):
    # Making a copy so the stored data is not modiified
    email = challenge["email"].copy()

    #Matching the frontend's expected null value.
    email["reply_to"] = email.get("reply_to") or None

    return{
        "id": challenge["id"],
        "tier": challenge["tier],
        "email": email,
        "hint_basic": challenge["hints"]["basic"]
    }
        
def get_challenges():
    #this function will retrieve all challenges from the database 
    # and return a list of dictionaries containing only the public information 
    # for each challenge.
    
    # Connect to the SQLite database
    connection = get_connection()

    try:
        # Retrieve all challenge records
        rows = connection.execute("""
            SELECT data_json
            FROM challenges
            ORDER BY id
        """).fetchall()

        challenges = []

        for row in rows:
            # Convert JSON text into a dictionary
            challenge = json.loads(row["data_json"])

            # Only include public information
            challenges.append(make_public_challenge(challenge))

        return challenges

    finally:
        connection.close()


def evaluate_answer(challenge_id, action):
    # Connect to SQLite
    connection = get_connection()

    try:
        # Retrieve the complete challenge, including private answers
        row = connection.execute("""
            SELECT data_json
            FROM challenges
            WHERE id = ?
        """, (challenge_id,)).fetchone()

        # The challenge was not found
        if row is None:
            return None

        # Convert JSON text into a Python dictionary
        challenge = json.loads(row["data_json"])

        # Check whether the submitted action is valid
        valid_actions = (
            "report",
            "verify_separately",
            "no_action"
        )

        if action not in valid_actions:
            raise ValueError("Invalid action")

        # Find the result of the player's decision
        outcome = challenge["action_outcome"][action]
        feedback = challenge["action_feedback"][action]

        return {
            "challenge_id": challenge_id,
            "action": action,
            "outcome": outcome,
            "feedback": feedback
        }

    finally:
        connection.close()


def get_ai_hint(challenge_id):
    # Connect to the database
    connection = get_connection()

    try:
        row = connection.execute("""
            SELECT data_json
            FROM challenges
            WHERE id = ?
        """, (challenge_id,)).fetchone()

        if row is None:
            return None

        challenge = json.loads(row["data_json"])

        # Retrieve the predefined AI hint
        return challenge["hints"]["ai"]["text"]

    finally:
        connection.close()


if __name__ == "__main__":
    challenges = get_challenges()

    print("Number of challenges:", len(challenges))

    for challenge in challenges:
        print(challenge["id"], "-", challenge["email"]["subject"])
