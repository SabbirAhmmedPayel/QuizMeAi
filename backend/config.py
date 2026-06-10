import os
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_openrouter import ChatOpenRouter

# ── Model Registry ──────────────────────────────────────────────
# Map model names to their provider and corresponding class
MODEL_REGISTRY = {
    "gemini-2.5-flash": {"provider": "google", "class": ChatGoogleGenerativeAI},
    "gemini-2.5-pro":   {"provider": "google", "class": ChatGoogleGenerativeAI},
    # OpenRouter models can be defined by their ID strings
    "claude-3-5-sonnet": {"provider": "openrouter", "class": ChatOpenRouter},
    "gpt-4o":            {"provider": "openrouter", "class": ChatOpenRouter},
    "deepseek-chat":     {"provider": "openrouter", "class": ChatOpenRouter},
}

# Mapping of your internal use cases to a model name string
USE_CASE_MODELS = {
    "ask":       os.getenv("ASK_MODEL", "gemini-2.5-flash"),
    "summarize": os.getenv("SUMMARY_MODEL", "gemini-2.5-flash"),
    "quiz":      os.getenv("QUIZ_MODEL", "gemini-2.5-flash"),
    "embeddings": "models/gemini-embedding-001",
}

def get_embeddings():
    """Returns the Google embedding model."""
    model = USE_CASE_MODELS["embeddings"]
    return GoogleGenerativeAIEmbeddings(model=model)


def get_chat_model(use_case: str = "ask", model: Optional[str] = None, **kwargs):
    """Factory to return the correct LangChain model instance."""
    model_name = model or USE_CASE_MODELS.get(use_case, "gemini-2.5-flash")
    config = MODEL_REGISTRY.get(model_name, {"provider": "google", "class": ChatGoogleGenerativeAI})
    
    model_class = config["class"]
    
    if config["provider"] == "openrouter":
        # ChatOpenRouter automatically picks up OPENROUTER_API_KEY from environment
        return model_class(model=model_name, **kwargs)
    
    # Default to Google Native
    return model_class(model=model_name, **kwargs)