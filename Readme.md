# QuizMe: PDF-Powered Study Assistant

QuizMe is an intelligent web application that turns your PDF documents into interactive study materials. Upload any PDF and instantly generate summaries, flashcards, and practice quizzes.

## Features
- **PDF Intelligence**: Ask questions directly about your document content.
- **Automated Study Tools**: Generate custom flashcards, MCQs, and short-answer questions.
- **Smart Summarization**: Get concise, context-aware summaries of long documents.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React (TypeScript/JavaScript)
- **AI/LLM Pipeline**: LangChain
- **Vector Database**: FAISS (for document retrieval)

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js & npm
- OpenAI API Key

### Backend Setup
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate` (Linux/macOS) or `venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. Create a `.env` file and add: `OPENAI_API_KEY=your_key_here`
6. `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## License
MIT