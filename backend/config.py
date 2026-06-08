# config.py
from langchain_google_genai import GoogleGenerativeAIEmbeddings

def get_embeddings():
    # Use one of the models returned by your verification script
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")