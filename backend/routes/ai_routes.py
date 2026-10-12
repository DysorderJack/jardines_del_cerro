from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Payment, Subscription, Unit
from schemas import AIChatPrompt
from services.gemini_service import GeminiService
from config import GEMINI_MODEL

router = APIRouter(prefix="/api/ai", tags=["Motor de Inteligencia Artificial (Gemini)"])

@router.post("/chat")
async def chat_ai(payload: AIChatPrompt, db: Session = Depends(get_db)):
    """
    Endpoint unificado de Inteligencia Artificial para:
    1. 'public': Visitantes web y prospectos.
    2. 'resident': Propietarios e inquilinos autenticados (requiere suscripción PayPal).
    3. 'admin': Copiloto Ejecutivo del Administrador (requiere suscripción PayPal corporativa).
    """
    extra_context = {}

    # Validar suscripción activa para residente o admin
    if payload.context_type in ["resident", "admin"]:
        sub_query = db.query(Subscription).filter(
            Subscription.context == payload.context_type,
            Subscription.status == "active"
        )
        if payload.context_type == "resident" and payload.user_id:
            sub_query = sub_query.filter(Subscription.user_id == payload.user_id)
        
        active_sub = sub_query.first()
        if not active_sub:
            raise HTTPException(
                status_code=402,
                detail=f"Acceso denegado: El módulo de IA para {payload.context_type} requiere una suscripción activa vía PayPal."
            )

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

    # Generar respuesta con Gemini o motor contextual
    response_text = await GeminiService.generate_response(
        prompt=payload.prompt,
        context_type=payload.context_type,
        extra_context=extra_context
    )

    return {
        "success": True,
        "response": response_text,
        "model": GEMINI_MODEL,
        "context_type": payload.context_type
    }
