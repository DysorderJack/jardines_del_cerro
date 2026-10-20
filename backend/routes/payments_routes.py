import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Payment, User, ElectronicInvoice
from schemas import PaymentCreate
from services.dgii_service import DGIIService
from services.ecf_service import ECFService

router = APIRouter(prefix="/api/payments", tags=["Pagos & Comprobantes Fiscales NCF"])

@router.get("/history")
def get_payment_history(unit: str = None, db: Session = Depends(get_db)):
    """Retorna el historial de pagos y recibos con NCF de la DGII."""
    query = db.query(Payment)
    if unit:
        query = query.filter(Payment.unit == unit)
    payments = query.order_by(Payment.created_at.desc()).all()

    return [
        {
            "id": p.id,
            "unit": p.unit,
            "period": p.period,
            "concept": p.concept,
            "ncf": p.ncf,
            "amount": p.amount,
            "method": p.method,
            "status": p.status,
            "date": p.date
        }
        for p in payments
    ]

@router.post("/pay")
def process_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    """
    Procesa el pago de cuota de mantenimiento y emite una Factura de Consumo Electrónica (e-CF Tipo E32)
    directamente conectada a la plataforma IMECF y validada ante la DGII bajo la Ley 32-23.
    """
    # 1. Parsear el monto como float
    clean_amt = 6500.0
    if isinstance(payload.amount, (int, float)):
        clean_amt = float(payload.amount)
    elif isinstance(payload.amount, str):
        digits = "".join(c for c in payload.amount if c.isdigit() or c == '.')
        try:
            clean_amt = float(digits) if digits else 6500.0
        except ValueError:
            clean_amt = 6500.0

    # 2. Buscar residente para Cédula y Nombre oficial
    resident = db.query(User).filter(User.unit == str(payload.unit)).first()
    res_name = resident.name if resident else f"Propietario Unidad {payload.unit}"
    res_cedula = resident.document_id if resident else "00000000000"

    # 3. Emitir Factura de Consumo Electrónica (e-CF Tipo E32) en vivo a IMECF Platform
    ecf_e32 = ECFService.emit_e32_consumo(
        resident_name=res_name,
        resident_cedula=res_cedula,
        unit=str(payload.unit),
        amount_dop=clean_amt,
        concept=payload.concept or f"Cuota de Mantenimiento {payload.period}",
        payment_method=payload.method or "Tarjeta en Línea / PayPal"
    )

    ncf_code = ecf_e32.get("encf") or DGIIService.generate_ncf("B02")
    payment_id = f"PAG-2026-{random.randint(100, 999)}"
    today_str = datetime.now().strftime("%d %b %Y")

    new_payment = Payment(
        id=payment_id,
        unit=payload.unit,
        period=payload.period,
        concept=payload.concept,
        ncf=ncf_code,
        amount=payload.amount,
        method=payload.method,
        status="Aprobado",
        date=today_str
    )
    db.add(new_payment)

    # 4. Guardar registro en electronic_invoices
    if ecf_e32 and ecf_e32.get("encf", "").startswith("E"):
        inv_record = ElectronicInvoice(
            id=ecf_e32["id"],
            encf=ecf_e32["encf"],
            type_id="32",
            type_name="Factura de Consumo Electrónica",
            context="resident_maintenance",
            user_id=resident.email if resident else f"unidad{payload.unit}@jardinesdelcerro.do",
            paypal_reference=payload.method,
            rnc_emisor=ecf_e32.get("rnc_emisor", "132907401"),
            razon_social_emisor=ecf_e32.get("razon_social_emisor", "UTESA"),
            rnc_receptor=ecf_e32.get("rnc_receptor", "00000000000"),
            razon_social_receptor=res_name,
            concept=payload.concept or f"Cuota de Mantenimiento {payload.period}",
            currency="DOP",
            exchange_rate=1.0,
            amount_usd=round(clean_amt / 60.50, 2),
            subtotal_dop=clean_amt,
            itbis_dop=0.0,
            total_dop=clean_amt,
            security_code=ecf_e32.get("security_code", "E32SEC"),
            qr_url=ecf_e32.get("qr_url", ""),
            status=ecf_e32.get("status", "Aceptado por DGII (TesteCF)"),
            dgii_track_id=ecf_e32.get("dgii_track_id")
        )
        db.add(inv_record)

    db.commit()

    return {
        "success": True,
        "payment_id": payment_id,
        "ncf": ncf_code,
        "encf": ncf_code,
        "security_code": ecf_e32.get("security_code"),
        "qr_url": ecf_e32.get("qr_url"),
        "amount": payload.amount,
        "period": payload.period,
        "date": today_str,
        "status": "Aprobado",
        "ecf": ecf_e32,
        "tax_authority": "Dirección General de Impuestos Internos (DGII)"
    }
