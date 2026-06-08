import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

try:
    client = genai.Client(api_key=api_key)
    
    print("Listing available models:")
    # The new SDK has a specific way to list models
    for m in client.models.list():
        # Check specifically for models that can embed
        if m.name and "embedding" in m.name.lower():
            print(f"Model ID: {m.name}")
            
except Exception as e:
    print(f"An error occurred: {e}")
    
    
#Model ID: models/gemini-embedding-001
#Model ID: models/gemini-embedding-2-preview
#Model ID: models/gemini-embedding-2