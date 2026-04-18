import os
from dotenv import load_dotenv
from pathlib import Path
import groq

# Target the exact .env file we found
ENV_PATH = Path("C:/Users/alido/Downloads/FYP/FYP/.env")
load_dotenv(ENV_PATH)

key = os.getenv("GROQ_API_KEY")
print(f"Testing with key: {key[:10]}..." if key else "No key found")

if not key:
    exit(1)

client = groq.Groq(api_key=key)

try:
    print("Sending request to Llama 3 8b...")
    resp = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello, are you there?"}],
        model="llama3-8b-8192"
    )
    print("Llama3-8b SUCCESS:", resp.choices[0].message.content)
except Exception as e:
    print("Llama3-8b FAILURE:", e)

try:
    print("\nSending request to Llama 3.3 70b...")
    resp = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello, are you there?"}],
        model="llama-3.3-70b-versatile"
    )
    print("Llama3.3-70b SUCCESS:", resp.choices[0].message.content)
except Exception as e:
    print("Llama3.3-70b FAILURE:", e)
