@echo off
setlocal

REM ------------------------------------------------------------
REM NammaShield Local Runner
REM - Validates local prerequisites and env
REM - Starts ML API in a new terminal
REM - Starts Next.js dev server in current terminal
REM ------------------------------------------------------------

set "ROOT=%~dp0"
set "ML_DIR=%ROOT%ml"

cd /d "%ROOT%"

echo.
echo [1/6] Checking required tools...
where node >nul 2>&1 || (echo ERROR: node is not installed or not on PATH.& exit /b 1)
where npm  >nul 2>&1 || (echo ERROR: npm is not installed or not on PATH.& exit /b 1)
where python >nul 2>&1 || (echo ERROR: python is not installed or not on PATH.& exit /b 1)

echo.
echo [2/6] Checking .env.local...
if not exist "%ROOT%.env.local" (
    echo ERROR: .env.local not found in project root.
    echo Create .env.local using values from demoenv.md before running.
    exit /b 1
)

set "MISSING_ENV=0"
findstr /B /C:"DATABASE_URL=" "%ROOT%.env.local" >nul || (
    echo ERROR: DATABASE_URL is missing in .env.local
    set "MISSING_ENV=1"
)
findstr /B /C:"OPENWEATHERMAP_API_KEY=" "%ROOT%.env.local" >nul || (
    echo ERROR: OPENWEATHERMAP_API_KEY is missing in .env.local
    set "MISSING_ENV=1"
)
findstr /B /C:"NEXT_PUBLIC_ML_API_URL=" "%ROOT%.env.local" >nul || (
    echo ERROR: NEXT_PUBLIC_ML_API_URL is missing in .env.local
    set "MISSING_ENV=1"
)
findstr /B /C:"ML_API_URL=" "%ROOT%.env.local" >nul || (
    echo WARNING: ML_API_URL is missing in .env.local (recommended for server-side routes)
)

if "%MISSING_ENV%"=="1" exit /b 1

echo.
echo [3/6] Installing frontend dependencies...
npm install || exit /b 1

echo.
echo [4/6] Preparing ML environment...
if not exist "%ML_DIR%\venv" (
    echo Creating Python virtual environment...
    python -m venv "%ML_DIR%\venv" || exit /b 1
)

call "%ML_DIR%\venv\Scripts\activate" || exit /b 1
pip install -r "%ML_DIR%\requirements.txt" || exit /b 1

if not exist "%ML_DIR%\risk_model.pkl" (
    echo Training risk model...
    python "%ML_DIR%\train_data.py" || exit /b 1
    python "%ML_DIR%\risk_model.py" || exit /b 1
)

if not exist "%ML_DIR%\fraud_model.pkl" (
    echo Training fraud model...
    python "%ML_DIR%\fraud_model.py" || exit /b 1
)

echo.
echo [5/6] Starting ML API in new terminal...
start "NammaShield ML API" cmd /k "cd /d ""%ML_DIR%"" && call venv\Scripts\activate && python api.py"

echo Waiting for ML API startup...
timeout /t 5 /nobreak >nul

echo.
echo [6/6] Starting Next.js dev server at http://localhost:3000
npm run dev
