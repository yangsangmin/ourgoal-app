@echo off
rem ES-199 repro launcher. Double-click to start. Close this window to stop.
chcp 65001 >nul
cd /d "%~dp0"
node "%~dp0repro-es199.js" %*
echo.
pause
