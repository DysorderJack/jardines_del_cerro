import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar .env si existe
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

def get_clean_env(key_name: str, default: str = "") -> str:
    """Obtiene una variable de entorno de forma tolerante a espacios en la clave, minúsculas/mayúsculas o comillas envolventes."""
    # 1. Búsqueda directa
    val = os.getenv(key_name)
    if val is not None and str(val).strip() != "":
        return str(val).strip().strip("\"'")
    
    # 2. Búsqueda tolerante a espacios accidentales en el nombre de la variable (común al pegar en Render)
    target = key_name.strip().upper()
    for k, v in os.environ.items():
        if k.strip().upper() == target:
            if v is not None and str(v).strip() != "":
                return str(v).strip().strip("\"'")
    return default

# Configuración del Entorno
ENV = get_clean_env("ENV", "development")
PORT = int(get_clean_env("PORT", "8000"))
HOST = get_clean_env("HOST", "0.0.0.0")

# Base de Datos (SQLite local por defecto, PostgreSQL para Render / Railway / Supabase)
DATABASE_URL = get_clean_env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'jardines_del_cerro.db'}")
# Si la URL viene con 'postgres://', SQLAlchemy requiere 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Almacenamiento de Archivos (Contratos Notariados PDF)
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Google Gemini API
GEMINI_API_KEY = get_clean_env("GEMINI_API_KEY", "")
GEMINI_MODEL = get_clean_env("GEMINI_MODEL", "gemini-3.5-flash-lite")

# PayPal REST API (Sandbox por defecto / Live para producción)
PAYPAL_MODE = get_clean_env("PAYPAL_MODE", "sandbox")  # 'sandbox' o 'live'
PAYPAL_CLIENT_ID = get_clean_env("PAYPAL_CLIENT_ID", "sb-dummy-client-id-for-preview")
PAYPAL_CLIENT_SECRET = get_clean_env("PAYPAL_CLIENT_SECRET", "")
PAYPAL_BASE_URL = (
    "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
)

# Seguridad y CORS
CORS_ORIGINS = [
    "*",  # Permite conexión desde cualquier cliente frontend en desarrollo o despliegue
]

# Configuración de Correo Electrónico (Notificaciones Oficiales vía Brevo API, Resend API o SMTP)
BREVO_API_KEY = get_clean_env("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = get_clean_env("BREVO_SENDER_EMAIL", "") or get_clean_env("SMTP_USER", "")
RESEND_API_KEY = get_clean_env("RESEND_API_KEY", "")
SMTP_HOST = get_clean_env("SMTP_HOST", "smtp.gmail.com")
try:
    SMTP_PORT = int(get_clean_env("SMTP_PORT", "587"))
except Exception:
    SMTP_PORT = 587
SMTP_USER = get_clean_env("SMTP_USER", "")
# Eliminar posibles espacios en blanco si el usuario copió la clave con formato 'xxxx xxxx xxxx xxxx'
SMTP_PASS = get_clean_env("SMTP_PASS", "").replace(" ", "").replace("-", "").strip()
SMTP_FROM = get_clean_env("SMTP_FROM", "") or SMTP_USER or "notificaciones@jardinesdelcerro.com"
FRONTEND_URL = get_clean_env("FRONTEND_URL", "https://jardines-del-cerro.vercel.app")

# Facturación Electrónica DGII (e-CF - Ley 32-23 - IMECF Platform)
ECF_API_KEY = get_clean_env("ECF_API_KEY", "ecf_live_6dfa18e5b57b39c212518f6ac148e3f7538ab343d93007a23542f2f402d9b5cc")
ECF_API_BASE_URL = get_clean_env("ECF_API_BASE_URL", "https://ecf-platform-backend-50801509587.us-central1.run.app")
ECF_RNC_EMISOR = get_clean_env("ECF_RNC_EMISOR", "132907401")
ECF_RAZON_SOCIAL_EMISOR = get_clean_env("ECF_RAZON_SOCIAL_EMISOR", "UTESA")
ECF_ENVIRONMENT = get_clean_env("ECF_ENVIRONMENT", "TesteCF")  # 'TesteCF' o 'eCF'
ECF_DEFAULT_EXCHANGE_RATE = float(get_clean_env("ECF_DEFAULT_EXCHANGE_RATE", "60.50"))


