import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

def test_connection():
    try:
        client = MongoClient(MONGO_URI)
        client.admin.command('ismaster')
        print("[SUCCESS] MongoDB Atlas Connection: OK")
        
        db = client.get_database()
        print(f"[INFO] Database name: {db.name}")
        
        users = db['users']
        count = users.count_documents({})
        print(f"[INFO] Current user count: {count}")
        
    except Exception as e:
        print(f"[FAILED] Connection ERROR: {e}")

if __name__ == "__main__":
    test_connection()
