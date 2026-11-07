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
            challenges.append({
                "id": challenge["id"],
                "type": challenge["type"],
                "tier": challenge["tier"],
                "email": challenge["email"]
            })

        return challenges

    finally:
        connection.close()

    
if __name__ == "__main__":
    challenges = get_challenges()

    print("Number of challenges:", len(challenges))

    for challenge in challenges:
        print(challenge["id"], "-", challenge["email"]["subject"])
