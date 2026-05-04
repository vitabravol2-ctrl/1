@echo off
setlocal
cd /d "%~dp0"

echo ======================================
echo Local AI Trading Terminal v0.2.1
echo Mode: DRY-RUN (LIVE BLOCKED)
echo ======================================

echo [SETUP] Running npm install...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

start "" "http://localhost:3000"
echo [START] Running npm start...
call npm start

if errorlevel 1 (
  echo [ERROR] Application exited with an error.
)

pause
endlocal
