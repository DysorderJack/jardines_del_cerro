from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Subscription, User, ElectronicInvoice
from schemas import PayPalVerifySubscription, PayPalVerifyOrder
from services.paypal_service import PayPalService
from services.ecf_service import ECFService

router = APIRouter(prefix="/api/paypal", tags=["Pasarela PayPal Subscriptions"])

@router.get("/config")
def get_paypal_config():
    """Retorna la configuración pública para el PayPal JavaScript SDK."""
    return PayPalService.get_public_config()

@router.get("/subscriptions/{context}")
def get_subscription_status(context: str, user_id: str = None, db: Session = Depends(get_db)):
    """
    Retorna el estado de la suscripción de IA.
    Para 'resident', el asistente es un beneficio condominal incluido (sin PayPal).
    Para 'admin', la Suite Ejecutiva gestiona suscripción vía PayPal.
    """
    if context == "resident":
        return {
            "active": True,
            "included": True,
            "plan": "Servicio Residente Incluido",
            "statusLabel": "Servicio Incluido para Residentes",
            "context": "resident"
        }

    if context == "admin" and user_id in ["usr-superadmin", "admin@jardinesdelcerro.do", "admin"]:
        return {
            "active": True,
            "is_superadmin": True,
            "subscription_exempt": True,
            "plan": "Acceso Maestro Permanente (Desarrollador)",
            "statusLabel": "Super Admin (Exento)",
            "context": "admin"
        }

    query = db.query(Subscription).filter(Subscription.context == context)
    if user_id:
        query = query.filter(Subscription.user_id == user_id)
    sub = query.order_by(Subscription.created_at.desc()).first()
    if not sub or sub.status != "active":
        return {
            "active": False,
            "is_superadmin": False,
            "subscription_exempt": False,
            "statusLabel": "Inactiva (Requiere Suscripción SaaS)",
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
        "encf": sub.encf,
        "securityCode": sub.security_code,
        "qrUrl": sub.qr_url,
        "statusLabel": "Activa vía PayPal"
    }

@router.post("/verify-order")
def verify_and_activate_order(payload: PayPalVerifyOrder, db: Session = Depends(get_db)):
    """
    Verifica con la API de PayPal una orden capturada, activa la suscripción en el sistema
    y emite de manera automática la Factura Electrónica con Valor de Crédito Fiscal (e-CF Tipo E31).
    """
    verify_result = PayPalService.verify_order(payload.order_id)
    if not verify_result.get("valid"):
        err_msg = verify_result.get("error") or f"Estado de orden: {verify_result.get('status')}"
        raise HTTPException(
            status_code=400,
            detail=f"La orden no pudo ser verificada por PayPal: {err_msg}"
        )

    # Calcular fecha de renovación
    days = 365 if payload.period == "Anual" else 30
    renewal_str = (datetime.now() + timedelta(days=days)).strftime("%d %b %Y")
    payer_email = verify_result.get("payer_email") or payload.user_id or "admin@jardinesdelcerro.do"

    # Emitir Factura Electrónica e-CF Tipo E31 ante la DGII (Ley 32-23)
    ecf_data = None
    if payload.context == "admin":
        ecf_data = ECFService.emit_e31_credito_fiscal(
            user_email=payer_email,
            plan_name=payload.plan_name,
            period=payload.period,
            price_usd=payload.price_usd,
            paypal_order_id=payload.order_id
        )

        new_ecf = ElectronicInvoice(
            id=ecf_data["id"],
            encf=ecf_data["encf"],
            type_id=ecf_data["type_id"],
            type_name=ecf_data["type_name"],
            context="admin_subscription",
            user_id=payer_email,
            paypal_reference=payload.order_id,
            rnc_emisor=ecf_data["rnc_emisor"],
            razon_social_emisor=ecf_data["razon_social_emisor"],
            rnc_receptor=ecf_data["rnc_receptor"],
            razon_social_receptor=ecf_data["razon_social_receptor"],
            concept=ecf_data["concept"],
            currency=ecf_data["currency"],
            exchange_rate=ecf_data["exchange_rate"],
            amount_usd=ecf_data["amount_usd"],
            subtotal_dop=ecf_data["subtotal_dop"],
            itbis_dop=ecf_data["itbis_dop"],
            total_dop=ecf_data["total_dop"],
            security_code=ecf_data["security_code"],
            qr_url=ecf_data["qr_url"],
            status=ecf_data["status"],
            dgii_track_id=ecf_data.get("dgii_track_id")
        )
        db.add(new_ecf)

    # Guardar suscripción en base de datos
    new_sub = Subscription(
        id=f"sub-{int(datetime.now().timestamp())}",
        context=payload.context,
        user_id=payer_email,
        plan_id=payload.plan_id,
        plan_name=payload.plan_name,
        period=payload.period,
        price_usd=payload.price_usd,
        paypal_sub_id=payload.order_id,
        status="active",
        renewal_date=renewal_str,
        encf=ecf_data.get("encf") if ecf_data else None,
        security_code=ecf_data.get("security_code") if ecf_data else None,
        qr_url=ecf_data.get("qr_url") if ecf_data else None
    )
    db.add(new_sub)
    db.commit()

    return {
        "success": True,
        "message": f"Pago confirmado con PayPal ({payload.order_id}) y Factura Electrónica e-CF Tipo E31 emitida exitosamente ante la DGII.",
        "paypalOrderId": payload.order_id,
        "payerEmail": payer_email,
        "plan": payload.plan_name,
        "renewalDate": renewal_str,
        "status": "active",
        "ecfInvoice": ecf_data
    }

@router.post("/verify-subscription")
def verify_and_activate_subscription(payload: PayPalVerifySubscription, db: Session = Depends(get_db)):
    """
    Verifica con PayPal la suscripción creada, la activa en el sistema y emite el e-CF E31.
    """
    # 1. Verificar contra la API de PayPal
    verify_result = PayPalService.verify_subscription(payload.paypal_sub_id)
    if not verify_result.get("valid"):
        raise HTTPException(
            status_code=400,
            detail=f"La suscripción no pudo ser verificada por PayPal: {verify_result.get('error') or verify_result.get('status')}"
        )

    # 2. Calcular fecha de renovación
    days = 365 if payload.period == "Anual" else 30
    renewal_str = (datetime.now() + timedelta(days=days)).strftime("%d %b %Y")
    payer_email = verify_result.get("payer_email") or payload.user_id or "admin@jardinesdelcerro.do"

    # 3. Emitir Factura Electrónica e-CF Tipo E31 (Ley 32-23)
    ecf_data = None
    if payload.context == "admin":
        ecf_data = ECFService.emit_e31_credito_fiscal(
            user_email=payer_email,
            plan_name=payload.plan_name,
            period=payload.period,
            price_usd=payload.price_usd,
            paypal_order_id=payload.paypal_sub_id
        )

        new_ecf = ElectronicInvoice(
            id=ecf_data["id"],
            encf=ecf_data["encf"],
            type_id=ecf_data["type_id"],
            type_name=ecf_data["type_name"],
            context="admin_subscription",
            user_id=payer_email,
            paypal_reference=payload.paypal_sub_id,
            rnc_emisor=ecf_data["rnc_emisor"],
            razon_social_emisor=ecf_data["razon_social_emisor"],
            rnc_receptor=ecf_data["rnc_receptor"],
            razon_social_receptor=ecf_data["razon_social_receptor"],
            concept=ecf_data["concept"],
            currency=ecf_data["currency"],
            exchange_rate=ecf_data["exchange_rate"],
            amount_usd=ecf_data["amount_usd"],
            subtotal_dop=ecf_data["subtotal_dop"],
            itbis_dop=ecf_data["itbis_dop"],
            total_dop=ecf_data["total_dop"],
            security_code=ecf_data["security_code"],
            qr_url=ecf_data["qr_url"],
            status=ecf_data["status"],
            dgii_track_id=ecf_data.get("dgii_track_id")
        )
        db.add(new_ecf)

    # 4. Guardar en base de datos
    new_sub = Subscription(
        id=f"sub-{int(datetime.now().timestamp())}",
        context=payload.context,
        user_id=payer_email,
        plan_id=payload.plan_id,
        plan_name=payload.plan_name,
        period=payload.period,
        price_usd=payload.price_usd,
        paypal_sub_id=payload.paypal_sub_id,
        status="active",
        renewal_date=renewal_str,
        encf=ecf_data.get("encf") if ecf_data else None,
        security_code=ecf_data.get("security_code") if ecf_data else None,
        qr_url=ecf_data.get("qr_url") if ecf_data else None
    )
    db.add(new_sub)
    db.commit()

    return {
        "success": True,
        "message": f"Suscripción PayPal activada con éxito para {payload.context} y e-CF Tipo E31 emitido.",
        "paypalSubId": payload.paypal_sub_id,
        "payerEmail": payer_email,
        "plan": payload.plan_name,
        "renewalDate": renewal_str,
        "status": "active",
        "ecfInvoice": ecf_data
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
