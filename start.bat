@echo off
echo ========================================
echo  HackOps Echelon - Integration Startup
echo ========================================
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ERROR: Backend directory not found!
    echo Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo ERROR: Frontend directory not found!
    echo Please run this script from the project root.
    pause
    exit /b 1
)

echo Step 1: Starting Backend (FastAPI)...
echo.
start "Backend - FastAPI" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo.
echo Step 2: Starting Frontend (Next.js)...
echo.
start "Frontend - Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo To check backend health:
echo   cd frontend
echo   npm run check-backend
echo.
echo Press any key to exit this window...
pause > nul
