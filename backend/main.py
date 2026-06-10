import os
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from operator import itemgetter
#from processor import process_pdf, save_vector_store, load_vector_store, extract_pdf_text
from localconfig import get_chat_model, MODEL_REGISTRY, USE_CASE_MODELS

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from typing import List, Optional

# Add this line instead:
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Import the helper function from your new config.py
from localconfig import get_embeddings
# Add at the top with other imports
# Correct imports for your version
# LangChain imports - Updated for latest version
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter


def create_hybrid_retriever(vector_store, docs):
    """Create a retriever that combines keyword and semantic search"""
    # BM25 keyword retriever
    bm25_retriever = BM25Retriever.from_documents(docs)
    bm25_retriever.k = 3
    
    # Vector retriever (your existing one)
    vector_retriever = vector_store.as_retriever(
        search_kwargs={"k": 3}
    )
    
    # Ensemble both
    ensemble_retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, vector_retriever],
        weights=[0.4, 0.6]  # Give more weight to vector search
    )
    
    return ensemble_retriever


class MCQ(BaseModel):
    question: str
    options: List[str]
    answer: str

class MCQList(BaseModel):
    questions: List[MCQ]

# ---------------- SETUP ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
INDEX_PATH = "faiss_index"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------- REQUEST MODEL ----------------
class QuestionRequest(BaseModel):
    question: str
    model: Optional[str] = None

class SummarizeRequest(BaseModel):
    level: str = "low"
    model: Optional[str] = None
    
    
#--------Processing pdfs -------------------------
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

def extract_pdf_text(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return "\n\n".join(doc.page_content for doc in documents)    


def expand_query(question: str) -> List[str]:
    """Generate alternative search queries for better retrieval"""
    # Simple keyword extraction
    important_words = [word for word in question.split() if len(word) > 4]
    
    # Create variations
    queries = [question]
    if important_words:
        queries.append(" ".join(important_words))  # Keywords only
    
    return queries


# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "RAG system running (LCEL version)"}

# ---------------- LIST MODELS ----------------
@app.get("/models")
def list_models():
    return {
        name: {**info, "use_cases": [uc for uc, m in USE_CASE_MODELS.items() if m == name]}
        for name, info in MODEL_REGISTRY.items()
    }

# ---------------- UPLOAD PDF ----------------
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    filename = file.filename or "uploaded.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"Processing PDF: {filename}")
        vector_store = process_pdf(file_path)
        save_vector_store(vector_store, INDEX_PATH)

        return {"message": f"{filename} indexed successfully", "status": "ok"}
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- ASK QUESTION (LCEL RAG) ----------------
@app.post("/ask")
async def ask_question(request: QuestionRequest):
    logger.info(f"Question: {request.question}")
    
    try:
        if not os.path.exists(os.path.join(INDEX_PATH, "index.faiss")):
            raise HTTPException(status_code=400, detail="No index found. Upload a PDF first.")
        
        vector_store = load_vector_store(INDEX_PATH)
        
        # Use MMR for diverse, relevant results
        retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": 5,
                "fetch_k": 15,
                "lambda_mult": 0.7,  # Balance relevance/diversity
            }
        )
        
        # Get initial retrieval
        docs = retriever.invoke(request.question)
        
        # Add relevance scores (if available)
        context_parts = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", "unknown")
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Improved prompt
        prompt = ChatPromptTemplate.from_template("""
You are a precise document analyst. Base your answer EXCLUSIVELY on the provided context.

**CONTEXT:**
{context}

**USER QUESTION:** {input}

**RULES:**
- If context has the answer → provide it directly
- If context partially answers → provide what's available
- If context has no relevant info → state "Not found in document"
- Use quotes from the original text when helpful
- Be specific with numbers, dates, and measurements

**YOUR ANSWER:**
""")
        
        llm = get_chat_model("ask", model=request.model) if request.model else get_chat_model("ask")
        
        rag_chain = (
            {
                "context": lambda x: context,  # Use pre-processed context
                "input": lambda x: x["input"]
            }
            | prompt
            | llm
        )
        
        async def generate():
            async for chunk in rag_chain.astream({"input": request.question}):
                if hasattr(chunk, "content"):
                    yield chunk.content
                elif chunk:
                    yield str(chunk)
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Ask error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
#from langchain_core.prompts import ChatPromptTemplate

@app.post("/generate-quiz")
async def generate_quiz(num_questions: int = 3, model: Optional[str] = None):
    # 1. Load data from your index
    vector_store = load_vector_store(INDEX_PATH)
    retriever = vector_store.as_retriever(search_kwargs={"k": 2})
    docs = retriever.invoke("Key concepts from the document")
    context = "\n\n".join(doc.page_content for doc in docs)

    # 2. Use Structured Output
    llm = get_chat_model("quiz", model=model) if model else get_chat_model("quiz")
    structured_llm = llm.with_structured_output(MCQList)

    # 3. Create the prompt
    prompt = ChatPromptTemplate.from_template("""
        You are an expert educator. Create {num_questions} multiple choice questions 
        based strictly on the context provided below.
        
        Context: {context}
    """)

    # 4. Generate
    chain = prompt | structured_llm
    result = chain.invoke({"num_questions": num_questions, "context": context})
    
    return result

@app.post("/summarize")
@app.post("/summerize")
async def summarize(request: Optional[SummarizeRequest] = None, level: Optional[str] = None):
    # Determine level from either request body or query parameter
    lvl = "low"
    if request is not None and request.level:
        lvl = request.level
    elif level is not None:
        lvl = level

    lvl = lvl.strip().lower()
    if lvl == "medium":
        lvl = "med"

    if lvl not in ["low", "med", "high"]:
        raise HTTPException(status_code=400, detail="Invalid level. Must be 'low', 'med', or 'high'.")

    if not os.path.exists(UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Upload directory does not exist. Please upload a PDF first.")

    pdf_files = [os.path.join(UPLOAD_DIR, f) for f in os.listdir(UPLOAD_DIR) if f.lower().endswith(".pdf")]
    if not pdf_files:
        raise HTTPException(status_code=400, detail="No PDF files found. Please upload a PDF first.")

    # Sort by modification time (newest first)
    pdf_files.sort(key=os.path.getmtime, reverse=True)
    latest_pdf = pdf_files[0]

    try:
        text_content = extract_pdf_text(latest_pdf)
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="The latest PDF appears to be empty or has no extractable text.")

        if lvl == "low":
            instruction = "Provide the lowest possible level of summarization (the most concise summary possible). Summarize the entire document in exactly one extremely brief and clear sentence (under 40 words)."
        elif lvl == "med":
            instruction = "Provide a moderate level of summarization. Write a brief summary of 1-2 concise paragraphs highlighting the most important main points and key takeaways (around 100-150 words)."
        else: # high
            instruction = "Provide a high/detailed level of summarization. Write a comprehensive, detailed, and structured summary covering all major concepts, chapters, arguments, and key details from the document (around 300-500 words)."

        llm = get_chat_model("summarize", model=request.model) if (request and request.model) else get_chat_model("summarize")
        
        prompt = ChatPromptTemplate.from_template("""
You are an expert document summarizer.
{instruction}

Document Content:
{context}

Summary:
""")
        chain = prompt | llm

        async def generate():
            async for chunk in chain.astream({"instruction": instruction, "context": text_content}):
                yield chunk.content if hasattr(chunk, "content") else str(chunk)

        return StreamingResponse(generate(), media_type="text/plain",
                                headers={"X-Level": lvl, "X-Pdf-File": os.path.basename(latest_pdf)})
    except Exception as e:
        logger.error(f"Summarize error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))