@echo off
:: Navigate to your project directory
cd /d "C:\everyProject\langchain\backend"

:: Activate the virtual environment
call ..\venv\Scripts\activate.bat

echo Starting Uvicorn server in the background...
:: Start uvicorn in a separate process window so we can continue the script
start "UvicornServer" uvicorn main:app --reload --host 127.0.0.1 --port 8000

:: Give the server a few seconds to boot up before running tests
echo Waiting for server to initialize...
timeout /t 5

echo Running tests...
python run.py

echo.
echo Tests complete. 
echo The server window is still running in the background.
pause