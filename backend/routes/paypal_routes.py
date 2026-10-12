from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Subscription, User
from schemas import PayPalVerifySubscription
from services.paypal_service import PayPalService

router = APIRouter(prefix="/api/paypal", tags=["Pasarela PayPal Subscriptions"])

@router.get("/config")
def get_paypal_config():
    """Retorna la configuración pública para el PayPal JavaScript SDK."""
    return PayPalService.get_public_config()

@router.get("/subscriptions/{context}")
def get_subscription_status(context: str, user_id: str = None, db: Session = Depends(get_db)):
    """
    Retorna el estado de la suscripción de IA para el 'resident' o 'admin'.
    """
    query = db.query(Subscription).filter(Subscription.context == context)
    if context == "resident" and user_id:
        query = query.filter(Subscription.user_id == user_id)
    
    sub = query.order_by(Subscription.created_at.desc()).first()
    if not sub or sub.status != "active":
        return {
            "active": False,
            "statusLabel": "Inactiva (Requiere Suscripción)",
            "context": context
        }

    return {
        "active": True,
        "plan": sub.plan_name,
        "period": sub.period,
        "priceUsd": sub.price_usd,
        "paypalSubId": sub.paypal_sub_id,
        "subscribedAt": sub.created_at.strftime("%d %b %Y"),
        "renewalDate": sub.renewal_date,
        "statusLabel": "Activa vía PayPal"
    }

@router.post("/verify-subscription")
def verify_and_activate_subscription(payload: PayPalVerifySubscription, db: Session = Depends(get_db)):
    """
    Verifica con PayPal la suscripción creada y la activa en la base de datos.
    """
    # 1. Verificar contra la API de PayPal
    verify_result = PayPalService.verify_subscription(payload.paypal_sub_id)
    if not verify_result.get("valid"):
        raise HTTPException(
            status_code=400,
            detail=f"La suscripción no pudo ser verificada por PayPal: {verify_result.get('status')}"
        )

    # 2. Calcular fecha de renovación
    days = 365 if payload.period == "Anual" else 30
    renewal_str = (datetime.now() + timedelta(days=days)).strftime("%d %b %Y")

    # 3. Guardar en base de datos
    new_sub = Subscription(
        id=f"sub-{int(datetime.now().timestamp())}",
        context=payload.context,
        user_id=payload.user_id,
        plan_id=payload.plan_id,
        plan_name=payload.plan_name,
        period=payload.period,
        price_usd=payload.price_usd,
        paypal_sub_id=payload.paypal_sub_id,
        status="active",
        renewal_date=renewal_str
    )
    db.add(new_sub)
    db.commit()

    return {
        "success": True,
        "message": f"Suscripción PayPal activada con éxito para {payload.context}.",
        "paypalSubId": payload.paypal_sub_id,
        "plan": payload.plan_name,
        "renewalDate": renewal_str,
        "status": "active"
    }

@router.post("/cancel-subscription")
def cancel_subscription(context: str = "resident", user_id: str = None, db: Session = Depends(get_db)):
    """Cancela la suscripción de IA activa."""
    query = db.query(Subscription).filter(
        Subscription.context == context,
        Subscription.status == "active"
    )
    if context == "resident" and user_id:
        query = query.filter(Subscription.user_id == user_id)

    sub = query.first()
    if sub:
        sub.status = "cancelled"
        db.commit()
        return {"success": True, "message": "Suscripción cancelada exitosamente."}

    raise HTTPException(status_code=404, detail="No se encontró una suscripción activa para cancelar.")
