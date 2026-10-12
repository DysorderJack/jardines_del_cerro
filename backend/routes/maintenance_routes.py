import random
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import MaintenanceTicket
from schemas import TicketCreate

router = APIRouter(prefix="/api/maintenance", tags=["Mantenimiento & Tickets"])

@router.get("/tickets")
def get_tickets(unit: str = None, db: Session = Depends(get_db)):
    """Retorna solicitudes y tickets de mantenimiento."""
    query = db.query(MaintenanceTicket)
    if unit:
        query = query.filter(MaintenanceTicket.unit == unit)
    tickets = query.order_by(MaintenanceTicket.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "unit": f"Unidad {t.unit}",
            "category": t.category,
            "subject": t.subject,
            "priority": t.priority,
            "status": t.status,
            "date": t.date
        }
        for t in tickets
    ]

@router.post("/tickets")
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    """Crea un nuevo ticket de mantenimiento."""
    tck_id = f"TCK-{random.randint(105, 199)}"
    new_tck = MaintenanceTicket(
        id=tck_id,
        unit=payload.unit,
        category=payload.category,
        subject=payload.subject,
        priority=payload.priority,
        status="En proceso",
        date="Hoy"
    )
    db.add(new_tck)
    db.commit()

    return {"success": True, "ticket_id": tck_id}
