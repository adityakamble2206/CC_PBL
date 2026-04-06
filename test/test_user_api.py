import requests
import json
import time
import subprocess
import os

def test_api():
    base_url = "http://127.0.0.1:5000"
    
    # 1. Start the server
    server_process = subprocess.Popen(["python", "backend/user_api.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(3) # Wait for server to start
    
    print("Testing User Management API...")
    
    try:
        # 2. Test Registration (Success)
        reg_payload = {
            "name": "Aditya Test",
            "email": "test@example.com",
            "password": "password123"
        }
        resp = requests.post(f"{base_url}/api/register", json=reg_payload)
        print(f"Registration (Success): {resp.status_code} - {resp.json()}")
        
        # 3. Test Registration (Short Password)
        short_pw_payload = {
            "name": "Short",
            "email": "short@example.com",
            "password": "123"
        }
        resp = requests.post(f"{base_url}/api/register", json=short_pw_payload)
        print(f"Registration (Short PW): {resp.status_code} - {resp.json()}")
        
        # 4. Test Registration (Invalid Email)
        bad_email_payload = {
            "name": "Bad",
            "email": "bademail",
            "password": "password123"
        }
        resp = requests.post(f"{base_url}/api/register", json=bad_email_payload)
        print(f"Registration (Bad Email): {resp.status_code} - {resp.json()}")

        # 5. Test Registration (Duplicate Email)
        resp = requests.post(f"{base_url}/api/register", json=reg_payload)
        print(f"Registration (Duplicate): {resp.status_code} - {resp.json()}")

        # 6. Test Get Users
        resp = requests.get(f"{base_url}/api/users")
        print(f"Get Users: {resp.status_code}")
        print(json.dumps(resp.json(), indent=2))

    finally:
        server_process.terminate()

if __name__ == "__main__":
    test_api()
