import random
import datetime
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Visit, ActivityLog
from schemas import VisitCreate, VisitResponse, VisitUpdateStatus
from services.email_service import send_visit_notification_email

logger = logging.getLogger("VisitRoutes")

router = APIRouter(prefix="/api/visits", tags=["Visitas & Citas"])

@router.get("", response_model=List[VisitResponse])
def get_all_visits(db: Session = Depends(get_db)):
    """
    Retorna todas las citas agendadas registradas en el sistema administrativo.
    """
    visits = db.query(Visit).order_by(Visit.created_at.desc()).all()
    return visits

@router.post("")
def create_visit(data: VisitCreate, db: Session = Depends(get_db)):
    """
    Registra una nueva cita agendada por un visitante o prospecto desde el sitio web,
    almacena todos los datos en la base de datos administrativa y despacha automáticamente
    un correo de notificación oficial a la administración del condominio.
    """
    visit_id = f"VIS-{random.randint(200, 999)}"
    now_str = datetime.datetime.now().strftime("%d %b %Y %I:%M %p")

    # 1. Enviar notificación por correo electrónico a la Administración
    email_res = send_visit_notification_email(
        visitor_name=data.visitor,
        visitor_phone=data.phone,
        visitor_email=data.email or "Sin correo especificado",
        unit=data.unit,
        visit_date=data.date,
        visit_time=data.time,
        mode=data.mode or "Presencial en Mao",
        notes=data.notes or "Sin requerimientos especiales",
        visit_id=visit_id
    )

    # 2. Registrar la cita en la base de datos
    new_visit = Visit(
        id=visit_id,
        visitor=data.visitor,
        phone=data.phone,
        email=data.email or "Sin correo",
        unit=data.unit,
        date=data.date,
        time=data.time,
        mode=data.mode or "Presencial en Mao",
        notes=data.notes or "Sin notas especiales",
        status="Pendiente",
        email_notified=True,
        email_notification_date=now_str
    )
    db.add(new_visit)

    # 3. Registrar actividad reciente para auditoría del administrador
    activity = ActivityLog(
        title=f"Nueva cita agendada ({data.unit}) — {data.visitor} ({data.date} {data.time})",
        time="Hace un momento",
        activity_type="visit"
    )
    db.add(activity)

    db.commit()
    db.refresh(new_visit)

    logger.info(f"✓ Cita {visit_id} creada exitosamente para {data.visitor} ({data.unit}).")

    return {
        "success": True,
        "message": f"Cita registrada con éxito. Notificación enviada al administrador.",
        "visit": {
            "id": new_visit.id,
            "visitor": new_visit.visitor,
            "phone": new_visit.phone,
            "email": new_visit.email,
            "unit": new_visit.unit,
            "date": new_visit.date,
            "time": new_visit.time,
            "mode": new_visit.mode,
            "notes": new_visit.notes,
            "status": new_visit.status,
            "email_notified": new_visit.email_notified,
            "email_notification_date": new_visit.email_notification_date
        },
        "email_notification": email_res
    }

@router.post("/{visit_id}/confirm")
def confirm_visit(visit_id: str, db: Session = Depends(get_db)):
    """
    Confirma una cita agendada, actualizando su estado a 'Confirmada'.
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    visit.status = "Confirmada"

    activity = ActivityLog(
        title=f"Cita confirmada ({visit.unit}) — {visit.visitor}",
        time="Hace un momento",
        activity_type="visit"
    )
    db.add(activity)

    db.commit()
    db.refresh(visit)

    return {
        "success": True,
        "message": f"Cita {visit_id} confirmada exitosamente.",
        "visit_id": visit_id,
        "status": "Confirmada"
    }

@router.delete("/{visit_id}")
def delete_visit(visit_id: str, db: Session = Depends(get_db)):
    """
    Elimina una cita de la agenda de visitas.
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    db.delete(visit)
    db.commit()

    return {
        "success": True,
        "message": f"Cita {visit_id} eliminada correctamente.",
        "visit_id": visit_id
    }
