import requests
import os
import sys

# CONFIGURATION
BASE_URL = "http://127.0.0.1:8000"
PDF_PATH = r"C:\game.pdf"  # Ensure this path is correct


def upload_pdf():
    """Upload PDF once at startup"""
    if not os.path.exists(PDF_PATH):
        print(f"Error: File not found at {PDF_PATH}")
        return False

    with open(PDF_PATH, "rb") as f:
        files = {"file": ("The pdf ", f, "application/pdf")}
        response = requests.post(f"{BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            print("✓ PDF uploaded successfully!")
            return True
        else:
            print(f"✗ Upload failed: {response.json()}")
            return False


def ask_question(question):
    """Send question to API and stream the response"""
    try:
        ask_payload = {"question": question}
        response = requests.post(f"{BASE_URL}/ask", json=ask_payload, stream=True)
        
        if response.status_code != 200:
            print(f"\n✗ Error: {response.status_code}")
            return
        
        print("\n🤖 Answer: ", end="", flush=True)
        for chunk in response.iter_content(chunk_size=None):
            if chunk:
                print(chunk.decode(), end="", flush=True)
        print("\n" + "-"*50 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\n✗ Connection error: Make sure the server is running at " + BASE_URL)
    except Exception as e:
        print(f"\n✗ Error: {e}")


def interactive_mode():
    """Main interactive loop for asking questions"""
    print("\n" + "="*50)
    print("📚 PDF Q&A Interactive Mode")
    print("="*50)
    print("Commands:")
    print("  - Type your question and press Enter")
    print("  - Type 'quit', 'exit', or press Ctrl+C to exit")
    print("  - Type 'help' to see this message again")
    print("="*50 + "\n")
    
    question_count = 0
    
    while True:
        try:
            # Get user input
            question = input(f"❓ Q{question_count + 1}> ").strip()
            
            # Check for exit commands
            if question.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            # Check for help
            if question.lower() == 'help':
                print("\n📖 Commands:")
                print("  - Just type your question and press Enter")
                print("  - 'quit', 'exit', or 'q' - Exit the program")
                print("  - 'help' - Show this help message")
                print("  - Ctrl+C - Force exit\n")
                continue
            
            # Skip empty questions
            if not question:
                print("⚠️  Please enter a question (or type 'quit' to exit)\n")
                continue
            
            # Ask the question
            ask_question(question)
            question_count += 1
            
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted by user. Goodbye!")
            break
        except EOFError:
            print("\n\n👋 Goodbye!")
            break


def main():
    """Main function"""
    print("🚀 Starting PDF Q&A Client...")
    
    # Upload PDF first
    if not upload_pdf():
        print("Failed to upload PDF. Exiting...")
        sys.exit(1)
    
    # Start interactive mode
    interactive_mode()


if __name__ == "__main__":
    main()