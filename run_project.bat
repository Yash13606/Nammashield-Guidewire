@echo off
REM ------------------------------------------------------------
REM NammaShield Project Runner
REM ------------------------------------------------------------

REM Ensure we are in the project root
cd /d "%~dp0"

REM ------------------------------------------------------------
REM Install Frontend Dependencies (if not already installed)
REM ------------------------------------------------------------
if not exist "node_modules" (
    echo Installing frontend dependencies with npm...
    npm install
) else (
    echo Frontend dependencies already installed.
)

REM ------------------------------------------------------------
REM Start the Python ML microservice in a new window
REM ------------------------------------------------------------
start "ML Service" cmd /c "cd /d \"%~dp0ml\" && ^
    if not exist venv (python -m venv venv) && ^
    call venv\\Scripts\\activate && ^
    pip install -r requirements.txt && ^
    python api.py"

REM Give the ML service a few seconds to start
timeout /t 5 /nobreak >nul

REM ------------------------------------------------------------
REM Launch the Next.js development server
REM ------------------------------------------------------------
echo Starting Next.js development server on http://localhost:3000
npm run dev
