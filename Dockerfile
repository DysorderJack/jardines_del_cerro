# ===================================================================
# Dockerfile Oficial para Google Cloud Run (Full-Stack / Backend API)
# Torre Residencial Jardines del Cerro IV | Mao, Valverde
# ===================================================================

FROM python:3.11-slim

# Evitar generación de bytecode .pyc y forzar salida inmediata en logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio base dentro del contenedor
WORKDIR /app

# 1. Instalar dependencias del backend
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# 2. Copiar todo el proyecto (Frontend web en la raíz y Backend en ./backend)
COPY . .

# 3. Cloud Run inyecta dinámicamente la variable PORT (por defecto 8080)
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# 4. Establecer el directorio de trabajo en /app/backend para que SQLite y config.py resuelvan rutas correctamente
WORKDIR /app/backend

# 5. Arrancar Uvicorn leyendo el puerto inyectado por Google Cloud Run
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]

