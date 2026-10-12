@echo off
title Torre Residencial Jardines del Cerro IV - Servidor Web Local
echo ======================================================================
echo    Torre Residencial Jardines del Cerro IV - Mao, Valverde
echo    Iniciando Servidor Web Local en http://localhost:3000/
echo ======================================================================
echo.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0servidor_local.ps1"
pause
