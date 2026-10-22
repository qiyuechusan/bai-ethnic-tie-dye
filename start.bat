@echo off
cd /d "%~dp0"
node server.js
if errorlevel 1 (
  echo.
  echo Server failed to start. Make sure Node.js 22.5 or newer is installed.
  pause
)
