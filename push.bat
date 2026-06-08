@echo off
:: Check if a message was provided
if "%~1"=="" (
    echo Usage: push "Your commit message"
    pause
    goto :eof
)

echo Adding files...
git add .

echo Committing...
git commit -m "%~1"

echo Pushing to GitHub...
git push

echo Done!
pause