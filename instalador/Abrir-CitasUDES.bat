@echo off
setlocal
for %%I in ("%~dp0..") do set "PRODUCTO=%%~fI"
start "Citas UDES - API" cmd.exe /k "cd /d ""%PRODUCTO%\backend"" && npm start"
timeout /t 3 /nobreak >nul
start "Citas UDES - Interfaz" cmd.exe /k "cd /d ""%PRODUCTO%\frontend"" && npm run dev -- --host 127.0.0.1 --strictPort"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
endlocal
