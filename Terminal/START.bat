@echo off
cd /d %~dp0

if not exist node_modules (
  echo Installing dependencies...
  npm install
)

start "" http://localhost:3000
npm start

if errorlevel 1 (
  echo.
  echo Terminal stopped with error.
  pause
)
