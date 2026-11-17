@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instala Node.js 20 o superior y vuelve a abrir este archivo.
 pause
 exit /b 1
)
if not exist node_modules\mqtt (
 call npm ci
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
start "" "http://localhost:8080"
call npm start
pause
