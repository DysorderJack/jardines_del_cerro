import os
import uvicorn
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import PORT, HOST, CORS_ORIGINS, UPLOAD_DIR
from database import engine, Base, SessionLocal
from seed_data import seed_database_if_empty

# Routers
from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router
from routes.payments_routes import router as payments_router
from routes.paypal_routes import router as paypal_router
from routes.ai_routes import router as ai_router
from routes.maintenance_routes import router as maintenance_router
from routes.assembly_routes import router as assembly_router

# 1. Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# 2. Inicializar FastAPI
app = FastAPI(
    title="Torre Residencial Jardines del Cerro IV — API Backend",
    description="Backend oficial con base de datos relacional, integración con PayPal Subscriptions, Google Gemini API y DGII NCF.",
    version="2.0.0"
)

# 3. Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Sembrar datos iniciales al arrancar
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

# 5. Montar almacenamiento de archivos subidos (Contratos Notariados PDF)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 6. Registrar Routers de la API
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(payments_router)
app.include_router(paypal_router)
app.include_router(ai_router)
app.include_router(maintenance_router)
app.include_router(assembly_router)

# 7. Endpoints de Estado y Chequeo de Salud
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "system": "Torre Residencial Jardines del Cerro IV",
        "version": "2.0.0",
        "database": "connected"
    }

@app.get("/api/info")
def api_info():
    return {
        "name": "Jardines del Cerro IV Backend API",
        "location": "Mao, Valverde, República Dominicana",
        "developer": "Inversionisto S.R.L.",
        "ai_engine": "Google Gemini (gemini-2.0-flash)",
        "payments": "PayPal Subscriptions API",
        "tax_authority": "DGII (Ley 173-07 / Ley 5038)"
    }

# 8. Servir frontend de sitio_web si index.html existe en el directorio padre
frontend_dir = Path(__file__).resolve().parent.parent
if (frontend_dir / "index.html").exists():
    app.mount("/sitio", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
