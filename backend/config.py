import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar .env si existe
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Configuración del Entorno
ENV = os.getenv("ENV", "development")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Base de Datos (SQLite local por defecto, PostgreSQL para Render / Railway / Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'jardines_del_cerro.db'}")
# Si la URL viene con 'postgres://', SQLAlchemy requiere 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Almacenamiento de Archivos (Contratos Notariados PDF)
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# PayPal REST API (Sandbox por defecto / Live para producción)
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")  # 'sandbox' o 'live'
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "sb-dummy-client-id-for-preview")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_BASE_URL = (
    "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
)

# Seguridad y CORS
CORS_ORIGINS = [
    "*",  # Permite conexión desde cualquier cliente frontend en desarrollo o despliegue
]
