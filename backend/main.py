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
from routes.visit_routes import router as visit_router
from routes.ecf_routes import router as ecf_router

# 1. Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

# 2. Inicializar FastAPI
app = FastAPI(
    title="Torre Residencial Jardines del Cerro IV — API Backend",
    description="Backend oficial con base de datos relacional, integración con PayPal Subscriptions, Google Gemini API y Facturación Electrónica e-CF DGII (Ley 32-23).",
    version="2.0.0"
)

# 3. Configuración de CORS & Private Network Access (Chrome / Edge / file:// support)
from starlette.types import ASGIApp, Scope, Receive, Send

class PrivateNetworkAccessMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                # Remover posible duplicado previo y agregar el encabezado PNA
                new_headers = [(k, v) for k, v in headers if k.lower() != b"access-control-allow-private-network"]
                new_headers.append((b"access-control-allow-private-network", b"true"))
                message["headers"] = new_headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

app.add_middleware(PrivateNetworkAccessMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Sembrar datos iniciales al arrancar
@app.on_event("startup")
def on_startup():
    # Asegurar que las nuevas columnas existan si la base de datos ya fue creada previamente
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            for col, col_type in [("confirmed_at", "VARCHAR(50)"), ("reminder_sent_at", "VARCHAR(50)")]:
                try:
                    conn.execute(text(f"ALTER TABLE visits ADD COLUMN {col} {col_type}"))
                    conn.commit()
                except Exception:
                    pass
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN subscription_exempt BOOLEAN DEFAULT 0"))
                conn.commit()
            except Exception:
                pass
            for col, col_type in [
                ("avatar_url", "TEXT"),
                ("emergency_contact", "VARCHAR(120)"),
                ("emergency_phone", "VARCHAR(30)"),
                ("vehicle_plate", "VARCHAR(30)"),
                ("vehicle_model", "VARCHAR(80)"),
                ("official_title", "VARCHAR(120)"),
                ("notify_email", "BOOLEAN DEFAULT 1"),
                ("notify_whatsapp", "BOOLEAN DEFAULT 1"),
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    conn.commit()
                except Exception:
                    pass
            for col, col_type in [
                ("encf", "VARCHAR(25)"),
                ("security_code", "VARCHAR(20)"),
                ("qr_url", "TEXT"),
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE subscriptions ADD COLUMN {col} {col_type}"))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass

    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

# 5. Montar almacenamiento de archivos subidos y documentos legales oficiales
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")
if not os.path.exists(DOCS_DIR):
    os.makedirs(DOCS_DIR, exist_ok=True)
app.mount("/docs", StaticFiles(directory=DOCS_DIR), name="docs")


# 6. Registrar Routers de la API
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(payments_router)
app.include_router(paypal_router)
app.include_router(ecf_router)
app.include_router(ai_router)
app.include_router(maintenance_router)
app.include_router(assembly_router)
app.include_router(visit_router)


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
        "tax_authority": "DGII (Ley 173-07 / Ley 5038 / Ley 32-23 Facturación Electrónica)",
        "electronic_invoicing": "e-CF Tipo E31 (Crédito Fiscal) & E32 (Consumo)"
    }

# 8. Servir frontend de sitio_web si index.html existe en el directorio padre
frontend_dir = Path(__file__).resolve().parent.parent
if (frontend_dir / "index.html").exists():
    app.mount("/sitio", StaticFiles(directory=str(frontend_dir), html=True), name="frontend_sitio")
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend_root")

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
