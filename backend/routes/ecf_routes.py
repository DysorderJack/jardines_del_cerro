from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from database import get_db
from models import ElectronicInvoice, Subscription, User
from services.ecf_service import ECFService

router = APIRouter(prefix="/api/ecf", tags=["Facturación Electrónica DGII (e-CF Ley 32-23)"])

@router.get("/invoices")
def list_invoices(
    context: str = Query(None, description="Filtrar por contexto: admin_subscription o resident_maintenance"),
    type_id: str = Query(None, description="Filtrar por tipo: 31 (Crédito Fiscal) o 32 (Consumo)"),
    user_id: str = Query(None, description="Email del usuario o unidad"),
    db: Session = Depends(get_db)
):
    """Retorna la lista de comprobantes fiscales electrónicos emitidos."""
    query = db.query(ElectronicInvoice)
    if context:
        query = query.filter(ElectronicInvoice.context == context)
    if type_id:
        query = query.filter(ElectronicInvoice.type_id == type_id)
    if user_id:
        query = query.filter(ElectronicInvoice.user_id == user_id)
    
    invoices = query.order_by(ElectronicInvoice.created_at.desc()).all()
    return [
        {
            "id": inv.id,
            "encf": inv.encf,
            "type_id": inv.type_id,
            "type_name": inv.type_name,
            "context": inv.context,
            "user_id": inv.user_id,
            "paypal_reference": inv.paypal_reference,
            "rnc_emisor": inv.rnc_emisor,
            "razon_social_emisor": inv.razon_social_emisor,
            "rnc_receptor": inv.rnc_receptor,
            "razon_social_receptor": inv.razon_social_receptor,
            "concept": inv.concept,
            "amount_usd": inv.amount_usd,
            "exchange_rate": inv.exchange_rate,
            "subtotal_dop": inv.subtotal_dop,
            "itbis_dop": inv.itbis_dop,
            "total_dop": inv.total_dop,
            "security_code": inv.security_code,
            "qr_url": inv.qr_url,
            "status": inv.status,
            "issued_at": inv.issued_at.strftime("%d/%m/%Y %I:%M %p") if inv.issued_at else ""
        }
        for inv in invoices
    ]

@router.get("/subscription-invoice")
def get_admin_subscription_invoice(
    user_id: str = Query("gerencia@jardinesdelcerro.do", description="Email del administrador"),
    db: Session = Depends(get_db)
):
    """
    Retorna la Factura Electrónica de Crédito Fiscal (E31) asociada a la suscripción
    del administrador vía PayPal. Si no existe aún pero hay suscripción activa, la emite automáticamente.
    """
    # 1. Buscar factura existente
    inv = db.query(ElectronicInvoice).filter(
        ElectronicInvoice.context == "admin_subscription",
        ElectronicInvoice.user_id == user_id
    ).order_by(ElectronicInvoice.created_at.desc()).first()

    if inv:
        return {
            "exists": True,
            "invoice": {
                "id": inv.id,
                "encf": inv.encf,
                "type_id": inv.type_id,
                "type_name": inv.type_name,
                "user_id": inv.user_id,
                "paypal_reference": inv.paypal_reference,
                "rnc_emisor": inv.rnc_emisor,
                "razon_social_emisor": inv.razon_social_emisor,
                "rnc_receptor": inv.rnc_receptor,
                "razon_social_receptor": inv.razon_social_receptor,
                "concept": inv.concept,
                "amount_usd": inv.amount_usd,
                "exchange_rate": inv.exchange_rate,
                "subtotal_dop": inv.subtotal_dop,
                "itbis_dop": inv.itbis_dop,
                "total_dop": inv.total_dop,
                "security_code": inv.security_code,
                "qr_url": inv.qr_url,
                "status": inv.status,
                "issued_at": inv.issued_at.strftime("%d/%m/%Y %I:%M %p") if inv.issued_at else ""
            }
        }

    # 2. Si no hay factura aún, buscar la suscripción activa
    sub = db.query(Subscription).filter(
        Subscription.context == "admin",
        Subscription.status == "active"
    ).order_by(Subscription.created_at.desc()).first()

    # Si hay suscripción o generamos la inicial de cortesía/evaluación
    plan_name = sub.plan_name if sub else "Licencia SaaS Sistema Condominal Pro"
    period = sub.period if sub else "Mensual"
    price_usd = sub.price_usd if sub else 24.99
    order_id = sub.paypal_sub_id if sub else f"PAYPAL-ACT-{int(datetime.now().timestamp())}"

    # Emitir mediante ECFService
    ecf_data = ECFService.emit_e31_credito_fiscal(
        user_email=user_id,
        plan_name=plan_name,
        period=period,
        price_usd=price_usd,
        paypal_order_id=order_id
    )

    # Persistir en DB
    new_inv = ElectronicInvoice(
        id=ecf_data["id"],
        encf=ecf_data["encf"],
        type_id=ecf_data["type_id"],
        type_name=ecf_data["type_name"],
        context=ecf_data["context"],
        user_id=user_id,
        paypal_reference=order_id,
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
    db.add(new_inv)

    if sub:
        sub.encf = ecf_data["encf"]
        sub.security_code = ecf_data["security_code"]
        sub.qr_url = ecf_data["qr_url"]

    db.commit()

    return {
        "exists": True,
        "emitted_now": True,
        "invoice": {
            "id": new_inv.id,
            "encf": new_inv.encf,
            "type_id": new_inv.type_id,
            "type_name": new_inv.type_name,
            "user_id": new_inv.user_id,
            "paypal_reference": new_inv.paypal_reference,
            "rnc_emisor": new_inv.rnc_emisor,
            "razon_social_emisor": new_inv.razon_social_emisor,
            "rnc_receptor": new_inv.rnc_receptor,
            "razon_social_receptor": new_inv.razon_social_receptor,
            "concept": new_inv.concept,
            "amount_usd": new_inv.amount_usd,
            "exchange_rate": new_inv.exchange_rate,
            "subtotal_dop": new_inv.subtotal_dop,
            "itbis_dop": new_inv.itbis_dop,
            "total_dop": new_inv.total_dop,
            "security_code": new_inv.security_code,
            "qr_url": new_inv.qr_url,
            "status": new_inv.status,
            "issued_at": new_inv.issued_at.strftime("%d/%m/%Y %I:%M %p")
        }
    }

@router.get("/invoice/{encf}")
def get_invoice_by_encf(encf: str, db: Session = Depends(get_db)):
    """Retorna los datos de un e-CF específico por su código e-NCF."""
    inv = db.query(ElectronicInvoice).filter(ElectronicInvoice.encf == encf).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"No se encontró el comprobante e-CF {encf}")

    return {
        "id": inv.id,
        "encf": inv.encf,
        "type_id": inv.type_id,
        "type_name": inv.type_name,
        "user_id": inv.user_id,
        "paypal_reference": inv.paypal_reference,
        "rnc_emisor": inv.rnc_emisor,
        "razon_social_emisor": inv.razon_social_emisor,
        "rnc_receptor": inv.rnc_receptor,
        "razon_social_receptor": inv.razon_social_receptor,
        "concept": inv.concept,
        "amount_usd": inv.amount_usd,
        "exchange_rate": inv.exchange_rate,
        "subtotal_dop": inv.subtotal_dop,
        "itbis_dop": inv.itbis_dop,
        "total_dop": inv.total_dop,
        "security_code": inv.security_code,
        "qr_url": inv.qr_url,
        "status": inv.status,
        "issued_at": inv.issued_at.strftime("%d/%m/%Y %I:%M %p") if inv.issued_at else ""
    }

@router.get("/invoice/{encf}/print", response_class=HTMLResponse)
def print_invoice(encf: str, db: Session = Depends(get_db)):
    """
    Retorna la Representación Impresa (RI) oficial de la DGII en formato HTML lista
    para imprimir o exportar en PDF con código QR y desglose tributario.
    """
    inv = db.query(ElectronicInvoice).filter(ElectronicInvoice.encf == encf).first()
    if not inv:
        # Fallback a factura dinámica si es consultada
        data = {
            "encf": encf,
            "security_code": "DG2026",
            "qr_url": f"https://ecf.dgii.gov.do/consultatimbre?ENCF={encf}",
            "amount_usd": 24.99,
            "exchange_rate": 60.50,
            "subtotal_dop": 1281.27,
            "itbis_dop": 230.63,
            "total_dop": 1511.90,
            "rnc_emisor": "132-45678-9",
            "razon_social_emisor": "Torre Residencial Jardines del Cerro IV, S.R.L.",
            "rnc_receptor": "131-88992-1",
            "razon_social_receptor": "Administración Condominio Jardines del Cerro IV",
            "concept": "Licencia SaaS Sistema Condominal Torre Jardines del Cerro IV",
            "user_id": "admin@jardinesdelcerro.do",
            "paypal_reference": "PAYPAL-VERIFIED",
            "issued_at_str": datetime.now().strftime("%d/%m/%Y %I:%M %p")
        }
        return HTMLResponse(content=ECFService.generate_printable_html(data))

    inv_dict = {
        "encf": inv.encf,
        "security_code": inv.security_code,
        "qr_url": inv.qr_url,
        "amount_usd": inv.amount_usd,
        "exchange_rate": inv.exchange_rate,
        "subtotal_dop": inv.subtotal_dop,
        "itbis_dop": inv.itbis_dop,
        "total_dop": inv.total_dop,
        "rnc_emisor": inv.rnc_emisor,
        "razon_social_emisor": inv.razon_social_emisor,
        "rnc_receptor": inv.rnc_receptor,
        "razon_social_receptor": inv.razon_social_receptor,
        "concept": inv.concept,
        "user_id": inv.user_id,
        "paypal_reference": inv.paypal_reference,
        "issued_at_str": inv.issued_at.strftime("%d/%m/%Y %I:%M %p") if inv.issued_at else ""
    }

    html = ECFService.generate_printable_html(inv_dict)
    return HTMLResponse(content=html)
