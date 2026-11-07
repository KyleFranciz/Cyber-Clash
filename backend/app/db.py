
import sqlite3
from pathlib import Path

# the location of the SQLite database.
DB_PATH = Path(__file__).resolve().parent.parent / "cyberclash.db"


def get_connection():
    """Open a connection to the Cyber Clash database."""

    connection = sqlite3.connect(DB_PATH)

    # Access database columns using their names.
    connection.row_factory = sqlite3.Row

    # this enables the  foreign key checks.
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


def init_db():
    """Create the database tables if they do not exist."""

    with get_connection() as connection: # open the connection to the database
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS challenges (
                id TEXT PRIMARY KEY,
                pack_id TEXT,
                night INTEGER,
                tier INTEGER,
                type TEXT,
                is_malicious INTEGER,
                best_action TEXT,
                data_json TEXT
            );

            CREATE TABLE IF NOT EXISTS learning_objectives (
                id TEXT PRIMARY KEY,
                title TEXT
            );

            
            CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                run_id TEXT,
                challenge_id TEXT,
                action TEXT,
                hint_used INTEGER,
                outcome TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS explanations (
                challenge_id TEXT,
                action TEXT,
                text TEXT,
                PRIMARY KEY (challenge_id, action)
            );

            CREATE TABLE IF NOT EXISTS lesson_sources (
                id TEXT PRIMARY KEY,
                title TEXT,
                publisher TEXT,
                url TEXT,
                accessed TEXT,
                checked INTEGER
            );

            CREATE TABLE IF NOT EXISTS lesson_passages (
                id TEXT PRIMARY KEY,
                objective_ids TEXT,
                tags TEXT,
                text TEXT,
                source_id TEXT
            );
        """)


if __name__ == "__main__":
    init_db()
    print(f"Cyber Clash database initialized: {DB_PATH}")
