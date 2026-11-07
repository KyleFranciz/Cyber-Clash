from app.db import get_connection, init_db # allows you to import the get_connection and init_db functions from the db.py file in the app directory.

# this script initializes the database and prints the names of the tables in the database.
init_db()

connection = get_connection() # connects to the database using the get_connection function from db.py

#runs a SQL query to retrieve the names of all tables in the database and stores the result in the variable "tables".
tables = connection.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
""").fetchall()

#displays the table names in the console.
for table in tables:
    print(table["name"])

connection.close()