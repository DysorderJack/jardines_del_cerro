@echo off
title Servidor Backend - Torre Residencial Jardines del Cerro IV
echo =========================================================================
echo  Iniciando Backend FastAPI - Torre Residencial Jardines del Cerro IV
echo  Puerto: 8000 | Documentacion Swagger: http://localhost:8000/docs
echo =========================================================================
cd backend
py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
