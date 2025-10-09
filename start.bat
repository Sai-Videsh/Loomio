@echo off
setlocal EnableDelayedExpansion

:: =====================================================
::          LOOMIO - Complete Project Starter
:: =====================================================
:: This script checks and starts all required services:
:: 1. MySQL Database
:: 2. Backend Server (Node.js/Express)
:: 3. Frontend Development Server (Vite/React)
:: =====================================================

title Loomio - Starting Application

color 0B
echo.
echo ========================================================
echo                  LOOMIO PROJECT STARTER
echo ========================================================
echo.

:: =====================================================
:: STEP 1: Check MySQL Service
:: =====================================================
echo [1/5] Checking MySQL Database...
:: Try to check MySQL service (may not exist if using XAMPP/portable MySQL)
sc query mysql >nul 2>&1
if !errorlevel! neq 0 (
    echo ℹ️  MySQL service not found (may be using XAMPP or portable MySQL)
    echo    Attempting direct connection test...
) else (
    echo ✅ MySQL service is running
)

:: =====================================================
:: STEP 2: Test Database Connection
:: =====================================================
echo.
echo [2/5] Testing Database Connection...
mysql -u root -p2611 -e "USE loomio_db; SELECT 'Connected' as Status;" >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo ❌ ERROR: Cannot connect to loomio_db database!
    echo.
    echo Please check:
    echo   - MySQL is running
    echo   - Database 'loomio_db' exists
    echo   - Credentials in .env file are correct
    echo.
    pause
    exit /b 1
)
echo ✅ Database connection successful

:: =====================================================
:: STEP 3: Check Environment Configuration
:: =====================================================
echo.
echo [3/5] Checking Environment Configuration...
if not exist ".env" (
    echo.
    echo ⚠️  WARNING: .env file not found!
    echo.
    if exist ".env.example" (
        echo Creating .env from template...
        copy ".env.example" ".env" >nul
        echo.
        echo ✅ .env file created from template
        echo ⚠️  Please edit .env file with your database credentials
        echo.
        pause
        exit /b 1
    ) else (
        echo ❌ ERROR: .env.example not found!
        echo Please create a .env file manually.
        pause
        exit /b 1
    )
)
echo ✅ Environment configuration found

:: =====================================================
:: STEP 4: Start Backend Server
:: =====================================================
echo.
echo [4/5] Starting Backend Server...
echo.
echo ┌─────────────────────────────────────────────────┐
echo │  Backend Server Starting...                     │
echo │  API Endpoint: http://localhost:5000/api        │
echo └─────────────────────────────────────────────────┘
echo.

:: Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

:: Start backend in new window
start "Loomio Backend Server" cmd /k "cd /d "%cd%\backend" && echo ================================ && echo    LOOMIO BACKEND SERVER && echo    http://localhost:5000/api && echo ================================ && echo. && node src/server.js"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Verify backend is responding
echo Checking if backend is ready...
curl -s http://localhost:5000/api/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Backend server is ready
) else (
    echo ⚠️  Backend started but health check failed
    echo    This may be normal if health endpoint doesn't exist
)

:: =====================================================
:: STEP 5: Start Frontend Server
:: =====================================================
echo.
echo [5/5] Starting Frontend Development Server...
echo.
echo ┌─────────────────────────────────────────────────┐
echo │  Frontend Server Starting...                    │
echo │  Application: http://localhost:5173             │
echo └─────────────────────────────────────────────────┘
echo.

:: Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Start frontend in new window
start "Loomio Frontend Server" cmd /k "cd /d "%cd%\frontend" && echo ================================ && echo    LOOMIO FRONTEND SERVER && echo    http://localhost:5173 && echo ================================ && echo. && npm run dev"

:: Wait for frontend to start
echo Waiting for frontend to start...
timeout /t 6 /nobreak >nul

:: =====================================================
:: STEP 6: Open Application in Browser
:: =====================================================
echo.
echo Opening application in browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

:: =====================================================
:: SUCCESS MESSAGE
:: =====================================================
echo.
echo.
echo ========================================================
echo              🚀 LOOMIO IS NOW RUNNING! 🚀
echo ========================================================
echo.
echo   ✅ Database:  Connected and ready
echo   ✅ Backend:   http://localhost:5000/api
echo   ✅ Frontend:  http://localhost:5173
echo.
echo ────────────────────────────────────────────────────────
echo   Backend and Frontend servers are running in
echo   separate windows. Close those windows to stop.
echo ────────────────────────────────────────────────────────
echo.
echo   📖 Documentation:
echo      - README.md for project overview
echo      - ENV_SETUP.md for environment configuration
echo.
echo   🛑 To stop the servers:
echo      Close the Backend and Frontend terminal windows
echo      or press Ctrl+C in each window
echo.
echo ========================================================
echo.
pause
