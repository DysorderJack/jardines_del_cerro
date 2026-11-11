# ===================================================================
# Dockerfile Standalone para Backend API en Google Cloud Run / Render
# Torre Residencial Jardines del Cerro IV
# ===================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente del backend
COPY . .

# Puerto configurable (Cloud Run inyecta $PORT dinámicamente)
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# Arrancar Uvicorn leyendo el puerto inyectado por el entorno
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
