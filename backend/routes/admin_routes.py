import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Unit, RegistrationRequest, Payment, ActivityLog
from schemas import RegistrationDecision, UnitCreate, UnitUpdateStatus
from config import UPLOAD_DIR
from services.email_service import send_registration_decision_email

router = APIRouter(prefix="/api/admin", tags=["Administración Condominal"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Retorna las métricas clave (KPIs) del condominio."""
    total_units = db.query(Unit).count()
    available_units = db.query(Unit).filter(Unit.status == "available").count()
    reserved_units = db.query(Unit).filter(Unit.status == "reserved").count()
    occupied_units = total_units - available_units - reserved_units
    pending_reqs = db.query(RegistrationRequest).filter(RegistrationRequest.status == "pending").count()
    recent_activity = db.query(ActivityLog).order_by(ActivityLog.id.desc()).limit(6).all()

    return {
        "kpis": {
            "total_units": total_units,
            "available_units": available_units,
            "reserved_units": reserved_units,
            "occupied_units": occupied_units,
            "pending_requests_count": pending_reqs,
            "collection_rate": "94.2%",
            "reserve_fund": "RD$ 2,340,000.00",
            "pending_fees": "RD$ 19,500.00"
        },
        "recent_activity": [
            {"title": a.title, "time": a.time, "type": a.activity_type}
            for a in recent_activity
        ]
    }

@router.get("/requests")
def get_requests(db: Session = Depends(get_db)):
    """Retorna las solicitudes de acceso y contratos notariados para auditar."""
    reqs = db.query(RegistrationRequest).order_by(RegistrationRequest.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "date": r.contract_date or "Reciente",
            "applicantName": r.applicant_name,
            "documentId": r.document_id,
            "email": r.email,
            "phone": r.phone,
            "unit": r.unit,
            "roleRequested": r.role_requested,
            "roleLabel": r.role_label,
            "contractFile": r.contract_filename,
            "contractDate": r.contract_date,
            "status": r.status,
            "notes": r.notes
        }
        for r in reqs
    ]

@router.post("/requests/{req_id}/decision")
def request_decision(req_id: str, decision: RegistrationDecision, db: Session = Depends(get_db)):
    """
    Aprueba o rechaza una solicitud tras auditar el contrato notariado (Punto 16.4).
    """
    req = db.query(RegistrationRequest).filter(
        (RegistrationRequest.id == req_id) |
        (RegistrationRequest.email == req_id) |
        (RegistrationRequest.document_id == req_id)
    ).first()

    applicant_name = (req.applicant_name if req else None) or decision.applicant_name or "Residente"
    recipient_email = (req.email if req else None) or decision.email
    unit_str = (req.unit if req else None) or decision.unit or "101"
    role_label_str = (req.role_label if req else None) or decision.role_label or "Inquilino / Propietario"

    if not req and not recipient_email:
        raise HTTPException(status_code=404, detail=f"Solicitud {req_id} no encontrada en la base de datos.")

    if decision.action == "approve":
        if req:
            req.status = "approved"

            # Activar usuario
            user = db.query(User).filter(
                (User.document_id == req.document_id) | (User.email == req.email)
            ).first()
            if user:
                user.status = "approved"

            # Marcar la unidad como ocupada
            unit = db.query(Unit).filter(Unit.number == req.unit).first()
            if unit:
                unit.status = "occupied"
                unit.status_label = "Ocupado"

            # Registrar log
            db.add(ActivityLog(
                title=f"Solicitud aprobada: {applicant_name} habilitado en Unidad {unit_str}",
                time="Hace un momento",
                activity_type="user"
            ))
            db.commit()

        # Enviar notificación oficial por correo electrónico
        email_res = send_registration_decision_email(
            applicant_name=applicant_name,
            recipient_email=recipient_email,
            unit=unit_str,
            role_label=role_label_str,
            action="approve",
            req_id=req_id
        )

        return {
            "success": True,
            "message": f"Solicitud {req_id} aprobada con éxito. Residente habilitado.",
            "email_notification": email_res
        }

    elif decision.action == "reject":
        if req:
            req.status = "rejected"
            user = db.query(User).filter(
                (User.document_id == req.document_id) | (User.email == req.email)
            ).first()
            if user:
                user.status = "rejected"
            db.commit()

        # Enviar notificación oficial por correo electrónico
        email_res = send_registration_decision_email(
            applicant_name=applicant_name,
            recipient_email=recipient_email,
            unit=unit_str,
            role_label=role_label_str,
            action="reject",
            req_id=req_id
        )

        return {
            "success": True,
            "message": f"Solicitud {req_id} rechazada.",
            "email_notification": email_res
        }

    raise HTTPException(status_code=400, detail="Acción inválida. Usa 'approve' o 'reject'.")

@router.post("/send-test-email")
def send_test_email(email: str):
    """
    Envía un correo de prueba directo para verificar en tiempo real la configuración SMTP en Render.
    """
    try:
        return send_registration_decision_email(
            applicant_name="Administrador de Pruebas",
            recipient_email=email,
            unit="101",
            role_label="Propietario Titular",
            action="approve",
            req_id="TEST-SMTP-DIRECTO"
        )
    except Exception as e:
        return {
            "success": False,
            "sent_real_smtp": False,
            "recipient": email,
            "error": f"Excepción en el servidor: {type(e).__name__}: {str(e)}",
            "preview": "Error de ejecución en backend"
        }

@router.get("/contracts/{filename}")
def download_contract(filename: str):
    """Descarga o visualiza el archivo físico del contrato notariado."""
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        return FileResponse(file_path, filename=filename)
    # Si es un archivo de demostración que aún no se ha subido físicamente
    return {
        "status": "virtual_record",
        "filename": filename,
        "notary": "Notaría Pública de los del Número del Municipio de Mao, Valverde",
        "act_number": "ACTO NO. 2026-081-ND",
        "description": "Documento legal notariado en expediente de debida diligencia conforme a la Ley 5038 y Ley 155-17."
    }

@router.get("/residents")
def get_residents(db: Session = Depends(get_db)):
    """Directorio de residentes y copropietarios."""
    users = db.query(User).filter(User.role.in_(["owner", "tenant"])).all()
    return [
        {
            "unit": f"Unidad {u.unit}",
            "name": u.name,
            "condition": u.role_label,
            "phone": u.phone or "(809) 555-0100",
            "status": "Al día" if u.status == "approved" else "Pendiente"
        }
        for u in users
    ]

@router.post("/units")
def create_unit(unit_in: UnitCreate, db: Session = Depends(get_db)):
    """Agrega una nueva unidad al inventario del condominio."""
    existing = db.query(Unit).filter(Unit.number == unit_in.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="El número de unidad ya existe.")

    new_unit = Unit(
        id=f"unit-{unit_in.number.lower().replace(' ', '-')}",
        number=unit_in.number,
        unit_type=unit_in.unit_type,
        type_name="Penthouse" if unit_in.unit_type == "penthouse" else "Apartamento",
        sqm=unit_in.sqm,
        bedrooms=unit_in.bedrooms,
        bathrooms=unit_in.bathrooms,
        level=unit_in.level,
        status=unit_in.status,
        status_label="Disponible" if unit_in.status == "available" else ("Reservado" if unit_in.status == "reserved" else "Ocupado"),
        price="Consultar",
        image=unit_in.image or "img/photo-1564078516393-cf04bd966897_w800_h600.jpg"
    )
    db.add(new_unit)
    db.commit()
    return {"success": True, "unit": unit_in.number}

@router.put("/units/{unit_id}/status")
def update_unit_status(unit_id: str, payload: UnitUpdateStatus, db: Session = Depends(get_db)):
    """Actualiza el estado de una unidad (disponible / reservado / ocupado)."""
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")

    unit.status = payload.status
    unit.status_label = "Disponible" if payload.status == "available" else ("Reservado" if payload.status == "reserved" else "Ocupado")
    db.commit()
    return {"success": True, "status": unit.status, "statusLabel": unit.status_label}

@router.delete("/requests/{req_id}")
def delete_registration_request(req_id: str, db: Session = Depends(get_db)):
    """
    Elimina una solicitud de registro (para depurar pruebas o solicitudes canceladas).
    """
    req = db.query(RegistrationRequest).filter(
        (RegistrationRequest.id == req_id) |
        (RegistrationRequest.email == req_id) |
        (RegistrationRequest.document_id == req_id)
    ).first()

    if req:
        # Si el usuario asociado está en estado pendiente o rechazado, también eliminarlo
        user = db.query(User).filter(
            (User.document_id == req.document_id) | (User.email == req.email)
        ).first()
        if user and user.status in ["pending", "rejected"]:
            db.delete(user)

        db.delete(req)
        db.commit()
        return {"success": True, "message": f"Solicitud {req_id} eliminada correctamente de la base de datos."}

    return {"success": True, "message": f"Solicitud {req_id} removida."}

@router.delete("/residents/{identifier}")
def delete_resident(identifier: str, db: Session = Depends(get_db)):
    """
    Desvincula y elimina a un residente/inquilino (cuando deja el condominio o para depurar usuarios de prueba).
    Libera la unidad residencial dejándola como 'Disponible'.
    """
    clean_id = identifier.replace("Unidad", "").replace("unidad", "").strip()

    # Buscar usuario por id, email, document_id o unidad
    user = db.query(User).filter(
        (User.id == identifier) |
        (User.email.ilike(identifier)) |
        (User.document_id == identifier) |
        (User.unit == clean_id)
    ).first()

    unit_number = user.unit if user else clean_id
    user_name = user.name if user else f"Unidad {clean_id}"

    if user:
        # Eliminar también solicitudes de registro asociadas a este residente
        reqs = db.query(RegistrationRequest).filter(
            (RegistrationRequest.document_id == user.document_id) |
            (RegistrationRequest.email == user.email) |
            (RegistrationRequest.unit == user.unit)
        ).all()
        for r in reqs:
            db.delete(r)

        db.delete(user)

    # Liberar la unidad (marcar como 'available')
    unit = db.query(Unit).filter(
        (Unit.number == unit_number) |
        (Unit.id == f"unit-{unit_number.lower().replace(' ', '-')}")
    ).first()
    if unit:
        unit.status = "available"
        unit.status_label = "Disponible"

    # Registrar en bitácora de auditoría
    db.add(ActivityLog(
        title=f"Residente desvinculado: {user_name} (Unidad {unit_number} liberada)",
        time="Hace un momento",
        activity_type="user"
    ))
    db.commit()

    return {
        "success": True,
        "message": f"Residente {user_name} desvinculado con éxito. La Unidad {unit_number} ahora está Disponible.",
        "unit": unit_number
    }

