import requests
import json

def test_login():
    url = "http://localhost:8000/api/v1/auth/login"
    payload = {
        "email": "ali.dot.raza@gmail.com",
        "password": "Y2Sgt5gfB2PBW8E"
    }
    
    print(f"Testing login at {url}...")
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("SUCCESS! Login works.")
            data = response.json()
            print(f"Access Token: {data.get('access')[:20]}...")
        else:
            print(f"FAILED: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_login()
