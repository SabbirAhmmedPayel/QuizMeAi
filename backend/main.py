import os
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from operator import itemgetter
from processor import process_pdf, save_vector_store, load_vector_store

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from typing import List

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

UPLOAD_DIR = "uploads"
INDEX_PATH = "faiss_index"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------- REQUEST MODEL ----------------
class QuestionRequest(BaseModel):
    question: str

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "RAG system running (LCEL version)"}

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
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})

        # Use a model confirmed to exist (e.g., gemini-2.5-flash)
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

        prompt = ChatPromptTemplate.from_template("""
You are a helpful assistant.
Use ONLY the context below to answer the question.

Context:
{context}

Question:
{input}

Answer clearly and concisely:
""")

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        # Correct LCEL pipeline using itemgetter
        rag_chain = (
            {
                "context": itemgetter("input") | retriever | format_docs,
                "input": itemgetter("input")
            }
            | prompt
            | llm
        )

        response = rag_chain.invoke({"input": request.question})

        return {"answer": response.content}

    except Exception as e:
        logger.error(f"Ask error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    

#from langchain_core.prompts import ChatPromptTemplate

@app.post("/generate-quiz")
async def generate_quiz(num_questions: int = 3):
    # 1. Load data from your index
    vector_store = load_vector_store(INDEX_PATH)
    retriever = vector_store.as_retriever(search_kwargs={"k": 2})
    docs = retriever.invoke("Key concepts from the document")
    context = "\n\n".join(doc.page_content for doc in docs)

    # 2. Use Structured Output (requires langchain-google-genai)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash") # Use your working model ID
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