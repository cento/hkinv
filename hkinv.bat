@echo off
cd /d "%~dp0"

if not exist "dist\index.html" (
    echo ERROR: dist\ folder not found. Run 'npm run build' first.
    echo.
    pause
    exit /b 1
)

echo Starting hkinv server on http://localhost:5173 ...
echo Press Ctrl+C or close this window to stop the server.
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0serve.ps1"

