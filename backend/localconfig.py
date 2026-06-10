import os
from langchain_ollama import ChatOllama, OllamaEmbeddings

# 1. Define your available models
# You can add more models here as you pull them in Ollama
MODEL_REGISTRY = {
    "qwen2.5-coder:7b": {"description": "General purpose coding and reasoning model"},
    "llama3.1:8b": {"description": "General purpose assistant"},
}

# 2. Map use cases to specific models
# This allows the app to select the best model for a specific task
USE_CASE_MODELS = {
    "ask": "qwen2.5-coder:7b",
    "quiz": "qwen2.5-coder:7b",
    "summarize": "qwen2.5-coder:7b"
}

def get_embeddings():
    """Returns the embedding model (using Ollama's embedding endpoint)."""
    # Note: Ensure you have pulled the embedding model, e.g., 'ollama pull nomic-embed-text'
    return OllamaEmbeddings(model="nomic-embed-text")

def get_chat_model(use_case: str, model: str = None):
    """
    Returns a configured ChatOllama instance.
    If 'model' is provided, it overrides the default for that use case.
    """
    model_name = model or USE_CASE_MODELS.get(use_case, "qwen2.5-coder:7b")
    
    return ChatOllama(
        model=model_name,
        temperature=0.7,
        num_ctx=8196  , 
        num_gpu=50 , 
        num_thread=8 ,
        repeat_penalty=1.1,
    )