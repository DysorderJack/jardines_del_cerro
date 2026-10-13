import random
import datetime
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Visit, ActivityLog
from schemas import VisitCreate, VisitResponse, VisitUpdateStatus
from services.email_service import (
    send_visit_notification_email,
    send_visit_received_email_to_visitor,
    send_visit_confirmed_email,
    send_visit_confirmed_admin_email,
    send_visit_reminder_email
)

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
    almacena todos los datos en la base de datos administrativa y despacha automáticamente:
    1. Correo de notificación oficial con el expediente a la Administración.
    2. Correo de acuse de recibo y comprobante oficial al correo del Visitante.
    """
    visit_id = f"VIS-{random.randint(200, 999)}"
    now_str = datetime.datetime.now().strftime("%d %b %Y %I:%M %p")

    # 1. Enviar notificación por correo electrónico a la Administración
    admin_email_res = send_visit_notification_email(
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

    # 2. Enviar comprobante oficial al Visitante si suministró correo válido
    visitor_email_res = None
    if data.email and "@" in data.email and "sin correo" not in data.email.lower():
        visitor_email_res = send_visit_received_email_to_visitor(
            visitor_name=data.visitor,
            visitor_email=data.email,
            visitor_phone=data.phone,
            unit=data.unit,
            visit_date=data.date,
            visit_time=data.time,
            mode=data.mode or "Presencial en Mao",
            notes=data.notes or "Sin requerimientos especiales",
            visit_id=visit_id
        )

    # 3. Registrar la cita en la base de datos
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

    # 4. Registrar actividad reciente para auditoría del administrador
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
        "message": "Cita registrada con éxito. Notificaciones enviadas al administrador y al visitante.",
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
        "email_notification": admin_email_res,
        "visitor_email_notification": visitor_email_res
    }

@router.post("/{visit_id}/confirm")
def confirm_visit(visit_id: str, db: Session = Depends(get_db)):
    """
    Confirma una cita agendada:
    1. Actualiza el estado a 'Confirmada' y registra fecha de confirmación.
    2. Envía correo oficial de confirmación con instrucciones de acceso al VISITANTE.
    3. Envía correo oficial de notificación de confirmación al ADMINISTRADOR.
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    now_str = datetime.datetime.now().strftime("%d %b %Y %I:%M %p")
    visit.status = "Confirmada"
    visit.confirmed_at = now_str

    # Despachar correos de confirmación a Usuario y a Administrador
    visitor_email_res = None
    if visit.email and "@" in visit.email and "sin correo" not in visit.email.lower():
        visitor_email_res = send_visit_confirmed_email(
            visitor_name=visit.visitor,
            visitor_email=visit.email,
            visitor_phone=visit.phone,
            unit=visit.unit,
            visit_date=visit.date,
            visit_time=visit.time,
            mode=visit.mode,
            notes=visit.notes,
            visit_id=visit.id
        )

    admin_email_res = send_visit_confirmed_admin_email(
        visitor_name=visit.visitor,
        visitor_email=visit.email or "Sin correo",
        visitor_phone=visit.phone,
        unit=visit.unit,
        visit_date=visit.date,
        visit_time=visit.time,
        mode=visit.mode,
        notes=visit.notes,
        visit_id=visit.id
    )

    activity = ActivityLog(
        title=f"Cita confirmada ({visit.unit}) — {visit.visitor} (correos despachados)",
        time="Hace un momento",
        activity_type="visit"
    )
    db.add(activity)

    db.commit()
    db.refresh(visit)

    logger.info(f"✓ Cita {visit_id} confirmada. Correos despachados a visitante y admin.")

    return {
        "success": True,
        "message": f"Cita {visit_id} confirmada exitosamente. Correos despachados al visitante y al administrador.",
        "visit_id": visit_id,
        "status": "Confirmada",
        "confirmed_at": now_str,
        "emails": {
            "user": visitor_email_res,
            "admin": admin_email_res
        }
    }

@router.post("/{visit_id}/reminder")
def send_visit_reminder(visit_id: str, db: Session = Depends(get_db)):
    """
    Despacha un correo electrónico de recordatorio de cita al visitante
    y registra la fecha del último recordatorio en el sistema.
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if not visit.email or "@" not in visit.email or "sin correo" in visit.email.lower():
        raise HTTPException(
            status_code=400,
            detail=f"La cita {visit_id} ({visit.visitor}) no tiene un correo electrónico válido registrado para enviar recordatorios."
        )

    now_str = datetime.datetime.now().strftime("%d %b %Y %I:%M %p")

    # Enviar correo de recordatorio al visitante
    email_res = send_visit_reminder_email(
        visitor_name=visit.visitor,
        visitor_email=visit.email,
        visitor_phone=visit.phone,
        unit=visit.unit,
        visit_date=visit.date,
        visit_time=visit.time,
        mode=visit.mode,
        visit_id=visit.id
    )

    visit.reminder_sent_at = now_str

    activity = ActivityLog(
        title=f"🔔 Recordatorio de cita enviado a {visit.visitor} ({visit.email})",
        time="Hace un momento",
        activity_type="visit"
    )
    db.add(activity)

    db.commit()
    db.refresh(visit)

    logger.info(f"✓ Recordatorio de cita {visit_id} enviado a {visit.email}.")

    return {
        "success": True,
        "message": f"Recordatorio enviado exitosamente a {visit.visitor} ({visit.email}).",
        "visit_id": visit_id,
        "reminder_sent_at": now_str,
        "email_result": email_res
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
