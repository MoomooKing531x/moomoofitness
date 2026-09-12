@echo off
setlocal

echo ============================================
echo   Fitness Leaderboard - Local Test Launcher
echo ============================================
echo.

REM Move to the folder this script lives in
cd /d "%~dp0"

REM Check Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found on your PATH.
    echo Install it from https://nodejs.org and re-run this script.
    pause
    exit /b 1
)

REM Set up .env if it doesn't exist yet
if not exist ".env" (
    echo No .env file found - creating one from .env.example.
    copy ".env.example" ".env" >nul
    echo.
    echo [ACTION NEEDED] Open the new .env file and set:
    echo   DATABASE_URL   - a real Postgres connection string
    echo   JWT_SECRET     - any long random string
    echo.
    echo Then run start.bat again.
    pause
    exit /b 1
)

REM Install dependencies if this is the first run
if not exist "node_modules" (
    echo Installing dependencies, this may take a minute...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. See the output above.
        pause
        exit /b 1
    )
)

echo Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] prisma generate failed.
    pause
    exit /b 1
)

echo Syncing database schema...
call npx prisma db push
if errorlevel 1 (
    echo [ERROR] Could not reach the database.
    echo Double check DATABASE_URL in your .env file.
    pause
    exit /b 1
)

echo Seeding official exercises...
call npm run seed

echo.
echo ============================================
echo   Starting local server at http://localhost:3000
echo   Press CTRL+C in this window to stop it.
echo ============================================
echo.

REM Open the browser after a short delay so the server has time to boot
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

call npm run dev

pause
