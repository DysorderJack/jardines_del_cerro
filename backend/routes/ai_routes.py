from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Payment, Subscription, Unit
from schemas import AIChatPrompt
from services.gemini_service import GeminiService
from config import GEMINI_MODEL, GEMINI_API_KEY

router = APIRouter(prefix="/api/ai", tags=["Motor de Inteligencia Artificial (Gemini)"])

@router.get("/status")
def get_ai_status():
    """Verifica el estado actual de la configuración con Google Gemini."""
    has_key = bool(GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5)
    masked_key = f"{GEMINI_API_KEY[:6]}...{GEMINI_API_KEY[-4:]}" if has_key else "No configurada"
    return {
        "configured": has_key,
        "masked_key": masked_key,
        "model": GEMINI_MODEL,
        "provider": "Google Gemini (Google AI Studio)"
    }

@router.get("/test-connection")
@router.post("/test-connection")
def test_ai_connection(api_key: str = None):
    """Prueba la conexión real con la API de Google Gemini en vivo."""
    return GeminiService.test_connection(api_key)

@router.post("/chat")
async def chat_ai(payload: AIChatPrompt, db: Session = Depends(get_db)):
    """
    Endpoint unificado de Inteligencia Artificial para:
    1. 'public': Visitantes web y prospectos.
    2. 'resident': Propietarios e inquilinos autenticados.
    3. 'admin': Copiloto Ejecutivo del Administrador.
    """
    extra_context = {}

    # Estado de suscripción/membresía (Residentes tienen acceso incluido; Super Admin exento; Admin regular vía suscripción)
    has_active_sub = True
    if payload.context_type == "admin":
        if payload.user_id in ["usr-superadmin", "admin@jardinesdelcerro.do", "admin"]:
            has_active_sub = True
        else:
            sub_query = db.query(Subscription).filter(
                Subscription.context == "admin",
                Subscription.status == "active"
            )
            if payload.user_id:
                sub_query = sub_query.filter(Subscription.user_id == payload.user_id)
            active_sub = sub_query.first()
            has_active_sub = bool(active_sub) or bool(GEMINI_API_KEY)

    # Recopilar contexto en tiempo real desde la base de datos
    if payload.context_type == "resident":
        unit_num = payload.unit or "301"
        user = db.query(User).filter(User.unit == unit_num).first()
        last_payment = db.query(Payment).filter(Payment.unit == unit_num).order_by(Payment.created_at.desc()).first()

        extra_context = {
            "unit": unit_num,
            "resident_name": user.name if user else "Condómino",
            "aliquot": user.aliquot if user else "4.65%",
            "last_payment_ncf": last_payment.ncf if last_payment else "B0200000142",
            "last_payment_period": last_payment.period if last_payment else "Octubre 2025"
        }

    elif payload.context_type == "admin":
        total_units = db.query(Unit).count()
        occupied_units = db.query(Unit).filter(Unit.status == "occupied").count()
        
        extra_context = {
            "total_units": total_units,
            "occupied_units": occupied_units,
            "cartera_vencida": "RD$ 19,500.00 (Unidades 201 y 402)",
            "fondo_reserva": "RD$ 2,340,000.00",
            "tasa_mora": "3% mensual reglamentario (Art. 18)",
            "generador": "Cummins 150 kVA (412 hrs, diésel 85%)",
            "ascensor": "Otis Gen2 (Revisión mensual al día)"
        }

    # Generar respuesta con Gemini en vivo
    ai_result = await GeminiService.generate_response(
        prompt=payload.prompt,
        context_type=payload.context_type,
        extra_context=extra_context
    )

    if isinstance(ai_result, dict):
        return {
            "success": ai_result.get("success", False),
            "response": ai_result.get("response", ""),
            "model": ai_result.get("model", GEMINI_MODEL),
            "context_type": payload.context_type,
            "error": ai_result.get("error")
        }

    return {
        "success": True,
        "response": str(ai_result),
        "model": GEMINI_MODEL,
        "context_type": payload.context_type
    }

