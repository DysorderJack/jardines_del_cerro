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

# Configuración de Correo Electrónico (Notificaciones SMTP Oficiales)
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
# Eliminar posibles espacios en blanco si el usuario copió la clave con formato 'xxxx xxxx xxxx xxxx'
SMTP_PASS = os.getenv("SMTP_PASS", "").replace(" ", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "").strip() or SMTP_USER or "notificaciones@jardinesdelcerro.com"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://jardines-del-cerro.vercel.app").strip()

