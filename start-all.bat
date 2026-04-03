@echo off
title InvoiceFlow - Starting All Services
echo.
echo ============================================
echo   InvoiceFlow - Starting All Services
echo ============================================
echo.

:: Start Backend (Node.js) in a new window
echo [1/3] Starting Backend (port 5000)...
start "InvoiceFlow Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Small delay to let backend initialize first
timeout /t 3 /nobreak >nul

:: Start AI Service (Python FastAPI) in a new window
echo [2/3] Starting AI Service (port 8000)...
start "InvoiceFlow AI Service" cmd /k "cd /d %~dp0ai-service && python main.py"

:: Small delay
timeout /t 2 /nobreak >nul

:: Start Frontend (Vite React) in a new window
echo [3/3] Starting Frontend (port 5173)...
start "InvoiceFlow Frontend" cmd /k "cd /d %~dp0invoiceflow-react && npm run dev"

echo.
echo ============================================
echo   All services started!
echo ============================================
echo.
echo   Frontend:    http://localhost:5173
echo   Backend:     http://localhost:5000
echo   AI Service:  http://localhost:8000
echo.
echo   Close this window or press any key to exit.
echo   (Service windows will keep running)
echo.
pause
