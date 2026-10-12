import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Payment, User
from schemas import PaymentCreate
from services.dgii_service import DGIIService

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
    Procesa el pago de cuota de mantenimiento y emite un Comprobante Fiscal NCF válido.
    """
    # Generar Comprobante Fiscal oficial de Consumidor Final (B02)
    ncf_code = DGIIService.generate_ncf("B02")
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
    db.commit()

    return {
        "success": True,
        "payment_id": payment_id,
        "ncf": ncf_code,
        "amount": payload.amount,
        "period": payload.period,
        "date": today_str,
        "status": "Aprobado",
        "tax_authority": "Dirección General de Impuestos Internos (DGII)"
    }
