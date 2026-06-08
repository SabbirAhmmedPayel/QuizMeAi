from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Import the helper function from your new config.py
from config import get_embeddings

def process_pdf(file_path):
    # 1. Load the PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # 2. Split the text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)

    # 3. Embed and store in FAISS using the helper
    embeddings = get_embeddings()
    vector_store = FAISS.from_documents(docs, embeddings)
    
    return vector_store

def save_vector_store(vector_store, folder_name="faiss_index"):
    vector_store.save_local(folder_name)

def load_vector_store(folder_name="faiss_index"):
    # Always use the same helper to ensure consistency
    embeddings = get_embeddings()
    
    return FAISS.load_local(
        folder_name, 
        embeddings, 
        allow_dangerous_deserialization=True
    )