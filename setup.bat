@echo off
setlocal EnableDelayedExpansion

:: =====================================================
::      LOOMIO - Complete Project Setup Script
:: =====================================================
:: This script will:
:: 1. Check system requirements
:: 2. Setup environment configuration
:: 3. Install dependencies
:: 4. Setup MySQL database
:: 5. Run database migrations
:: 6. Verify installation
:: =====================================================

title Loomio - Complete Setup

color 0B
cls
echo.
echo ========================================================
echo            LOOMIO - COMPLETE PROJECT SETUP
echo ========================================================
echo.
echo This wizard will guide you through the complete setup
echo of the Loomio Community Task Management System.
echo.
echo Please ensure you have:
echo   - Node.js (v16 or higher) installed
echo   - MySQL (v8.0 or higher) installed and running
echo   - Git installed
echo.
pause
cls

:: =====================================================
:: STEP 1: Check System Requirements
:: =====================================================
echo.
echo ========================================================
echo [STEP 1/7] Checking System Requirements
echo ========================================================
echo.

:: Check Node.js
echo Checking Node.js...
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: v16 or higher
    echo.
    pause
    exit /b 1
)

:: Get Node version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js found: !NODE_VERSION!

:: Check npm
echo Checking npm...
where npm >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ ERROR: npm is not installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm found: v!NPM_VERSION!

:: Check MySQL
echo Checking MySQL...
where mysql >nul 2>&1
if !errorlevel! neq 0 (
    echo ⚠️  WARNING: MySQL command not found in PATH
    echo    MySQL might still be installed but not in PATH
    echo    (Common with XAMPP installations)
    echo.
    set /p MYSQL_PATH="Enter full path to mysql.exe (or press Enter to skip): "
    if "!MYSQL_PATH!" neq "" (
        set "PATH=!PATH!;!MYSQL_PATH!"
    )
) else (
    for /f "tokens=*" %%i in ('mysql --version') do set MYSQL_VERSION=%%i
    echo ✅ MySQL found: !MYSQL_VERSION!
)

:: Check Git
echo Checking Git...
where git >nul 2>&1
if !errorlevel! neq 0 (
    echo ⚠️  WARNING: Git is not installed
    echo    Git is optional but recommended
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo ✅ Git found: !GIT_VERSION!
)

echo.
echo ✅ System requirements check completed!
echo.
pause
cls

:: =====================================================
:: STEP 2: Environment Configuration
:: =====================================================
echo.
echo ========================================================
echo [STEP 2/7] Environment Configuration
echo ========================================================
echo.

if exist ".env" (
    echo ⚠️  .env file already exists!
    set /p OVERWRITE="Do you want to reconfigure? (y/n): "
    if /i "!OVERWRITE!" neq "y" (
        echo Skipping environment configuration...
        goto :skip_env_setup
    )
)

echo Setting up environment configuration...
echo.

:: Get database configuration
set /p DB_HOST="Enter MySQL Host (default: localhost): " || set DB_HOST=localhost
if "!DB_HOST!"=="" set DB_HOST=localhost

set /p DB_PORT="Enter MySQL Port (default: 3306): " || set DB_PORT=3306
if "!DB_PORT!"=="" set DB_PORT=3306

set /p DB_USER="Enter MySQL Username (default: root): " || set DB_USER=root
if "!DB_USER!"=="" set DB_USER=root

set /p DB_PASS="Enter MySQL Password: "

set /p DB_NAME="Enter Database Name (default: loomio_db): " || set DB_NAME=loomio_db
if "!DB_NAME!"=="" set DB_NAME=loomio_db

:: Generate random JWT secret
set "JWT_SECRET=loomio_jwt_!RANDOM!!RANDOM!!RANDOM!_secret"

:: Get server port
set /p BACKEND_PORT="Enter Backend Port (default: 5000): " || set BACKEND_PORT=5000
if "!BACKEND_PORT!"=="" set BACKEND_PORT=5000

:: Email configuration (optional)
echo.
echo Email Configuration (for notifications - optional):
set /p SETUP_EMAIL="Do you want to configure email now? (y/n): "

if /i "!SETUP_EMAIL!"=="y" (
    set /p EMAIL_HOST="Email Host (default: smtp.gmail.com): " || set EMAIL_HOST=smtp.gmail.com
    if "!EMAIL_HOST!"=="" set EMAIL_HOST=smtp.gmail.com
    
    set /p EMAIL_PORT="Email Port (default: 587): " || set EMAIL_PORT=587
    if "!EMAIL_PORT!"=="" set EMAIL_PORT=587
    
    set /p EMAIL_USER="Email Address: "
    set /p EMAIL_PASS="Email App Password: "
) else (
    set EMAIL_HOST=smtp.gmail.com
    set EMAIL_PORT=587
    set EMAIL_USER=your_email@gmail.com
    set EMAIL_PASS=your_app_password
)

:: Create .env file
echo Creating .env file...
(
echo # ===================================
echo # LOOMIO PROJECT CONFIGURATION
echo # ===================================
echo.
echo # Database Configuration
echo DB_HOST=!DB_HOST!
echo DB_PORT=!DB_PORT!
echo DB_NAME=!DB_NAME!
echo DB_USER=!DB_USER!
echo DB_PASSWORD=!DB_PASS!
echo.
echo # JWT Configuration
echo JWT_SECRET=!JWT_SECRET!
echo JWT_EXPIRES_IN=7d
echo.
echo # Server Configuration
echo PORT=!BACKEND_PORT!
echo NODE_ENV=development
echo.
echo # Email Configuration
echo EMAIL_HOST=!EMAIL_HOST!
echo EMAIL_PORT=!EMAIL_PORT!
echo EMAIL_USER=!EMAIL_USER!
echo EMAIL_PASS=!EMAIL_PASS!
echo.
echo # Frontend Configuration
echo FRONTEND_URL=http://localhost:3000
echo VITE_API_URL=http://localhost:!BACKEND_PORT!/api
) > .env

echo ✅ .env file created successfully!

:skip_env_setup
echo.
pause
cls

:: =====================================================
:: STEP 3: Load Environment Variables
:: =====================================================
echo.
echo ========================================================
echo [STEP 3/7] Loading Configuration
echo ========================================================
echo.

:: Parse .env file
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" if not "!line!"=="" (
        set "%%a=%%b"
    )
)

echo ✅ Configuration loaded
echo    Database: !DB_NAME! at !DB_HOST!:!DB_PORT!
echo    Backend Port: !PORT!
echo.
pause
cls

:: =====================================================
:: STEP 4: Install Dependencies
:: =====================================================
echo.
echo ========================================================
echo [STEP 4/7] Installing Dependencies
echo ========================================================
echo.

:: Install root dependencies (if package.json exists)
if exist "package.json" (
    echo Installing root dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ ERROR: Failed to install root dependencies
        pause
        exit /b 1
    )
    echo ✅ Root dependencies installed
    echo.
)

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist "package.json" (
    echo ❌ ERROR: backend/package.json not found!
    pause
    exit /b 1
)

call npm install
if !errorlevel! neq 0 (
    echo ❌ ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed successfully
cd ..

:: Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
if not exist "package.json" (
    echo ❌ ERROR: frontend/package.json not found!
    pause
    exit /b 1
)

call npm install
if !errorlevel! neq 0 (
    echo ❌ ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully
cd ..

echo.
echo ✅ All dependencies installed!
echo.
pause
cls

:: =====================================================
:: STEP 5: Database Setup
:: =====================================================
echo.
echo ========================================================
echo [STEP 5/7] Database Setup
echo ========================================================
echo.

:: Test MySQL connection
echo Testing MySQL connection...
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! -e "SELECT 1;" >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ ERROR: Cannot connect to MySQL!
    echo.
    echo Please verify:
    echo   - MySQL is running
    echo   - Host: !DB_HOST!
    echo   - Port: !DB_PORT!
    echo   - Username: !DB_USER!
    echo   - Password is correct
    echo.
    pause
    exit /b 1
)
echo ✅ MySQL connection successful

:: Check if database exists
echo.
echo Checking if database exists...
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! -e "USE !DB_NAME!;" >nul 2>&1
if !errorlevel! neq 0 (
    echo Database '!DB_NAME!' does not exist.
    set /p CREATE_DB="Do you want to create it? (y/n): "
    if /i "!CREATE_DB!" neq "y" (
        echo ❌ Database setup cancelled
        pause
        exit /b 1
    )
    
    echo Creating database '!DB_NAME!'...
    mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! -e "CREATE DATABASE !DB_NAME! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if !errorlevel! neq 0 (
        echo ❌ ERROR: Failed to create database
        pause
        exit /b 1
    )
    echo ✅ Database created successfully
) else (
    echo ℹ️  Database '!DB_NAME!' already exists
    set /p RECREATE_DB="Do you want to drop and recreate it? (y/n): "
    if /i "!RECREATE_DB!"=="y" (
        echo Dropping existing database...
        mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! -e "DROP DATABASE !DB_NAME!;"
        echo Creating fresh database...
        mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! -e "CREATE DATABASE !DB_NAME! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        echo ✅ Database recreated successfully
    )
)

echo.
pause
cls

:: =====================================================
:: STEP 6: Run Database Migrations
:: =====================================================
echo.
echo ========================================================
echo [STEP 6/7] Running Database Migrations
echo ========================================================
echo.

:: Check for migration files
if exist "backend\migrations" (
    echo Checking for migration SQL files...
    
    :: Run each migration file if they exist
    if exist "backend\migrations\*.sql" (
        echo Running SQL migrations...
        for %%f in (backend\migrations\*.sql) do (
            echo   - Running %%~nxf...
            mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASS! !DB_NAME! < "%%f"
            if !errorlevel! neq 0 (
                echo   ⚠️  Warning: Migration %%~nxf may have failed
            ) else (
                echo   ✅ %%~nxf completed
            )
        )
    )
)

echo.
echo Starting backend to initialize database models...
echo (This will automatically create tables using Sequelize)
echo.
echo Please wait 10 seconds for models to sync...

:: Start backend temporarily to sync models
cd backend
start /b cmd /c "node src/server.js > nul 2>&1"
timeout /t 10 /nobreak >nul
taskkill /f /im node.exe >nul 2>&1
cd ..

echo ✅ Database initialization completed
echo.
pause
cls

:: =====================================================
:: STEP 7: Verification
:: =====================================================
echo.
echo ========================================================
echo [STEP 7/7] Verifying Installation
echo ========================================================
echo.

echo Verifying project structure...

:: Check critical files
set "VERIFY_OK=1"

if not exist "backend\src\server.js" (
    echo ❌ backend\src\server.js not found
    set "VERIFY_OK=0"
) else (
    echo ✅ Backend server file found
)

if not exist "frontend\src\main.jsx" (
    echo ❌ frontend\src\main.jsx not found
    set "VERIFY_OK=0"
) else (
    echo ✅ Frontend entry file found
)

if not exist "backend\node_modules" (
    echo ❌ Backend dependencies not installed
    set "VERIFY_OK=0"
) else (
    echo ✅ Backend dependencies verified
)

if not exist "frontend\node_modules" (
    echo ❌ Frontend dependencies not installed
    set "VERIFY_OK=0"
) else (
    echo ✅ Frontend dependencies verified
)

if not exist ".env" (
    echo ❌ .env file not found
    set "VERIFY_OK=0"
) else (
    echo ✅ Environment configuration verified
)

echo.
if "!VERIFY_OK!"=="1" (
    echo ========================================================
    echo           ✅ SETUP COMPLETED SUCCESSFULLY! ✅
    echo ========================================================
    echo.
    echo Your Loomio installation is ready!
    echo.
    echo 📝 Configuration Summary:
    echo    Database: !DB_NAME! at !DB_HOST!:!DB_PORT!
    echo    Backend API: http://localhost:!PORT!
    echo    Frontend: http://localhost:5173 (Vite dev server)
    echo.
    echo 🚀 Next Steps:
    echo.
    echo    1. Start the application:
    echo       start.bat
    echo.
    echo    2. Or start manually:
    echo       Backend:  cd backend ^&^& npm start
    echo       Frontend: cd frontend ^&^& npm run dev
    echo.
    echo    3. Quick start (no checks):
    echo       start-quick.bat
    echo.
    echo    4. Stop the application:
    echo       stop.bat
    echo.
    echo 📚 Documentation:
    echo    - README.md - Project overview
    echo    - IMPROVEMENTS-ROADMAP.md - Feature roadmap
    echo    - SETUP.md - Setup instructions
    echo.
    echo 🌐 Default Login Credentials:
    echo    After starting, register a new account or create
    echo    an admin user through the registration page.
    echo.
    echo ========================================================
) else (
    echo ========================================================
    echo              ⚠️  SETUP INCOMPLETE ⚠️
    echo ========================================================
    echo.
    echo Some verification checks failed.
    echo Please review the errors above and try again.
    echo.
)

echo.
echo Press any key to exit...
pause >nul

endlocal
