@echo off
cd /d "%~dp0"
if not exist node_modules\mqtt (
 echo Primero abre ABRIR_WEB.bat para instalar las dependencias.
 pause
 exit /b 1
)
call npm run simulador
pause
