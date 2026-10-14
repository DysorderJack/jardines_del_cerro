import os
import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Unit, RegistrationRequest, Payment, ActivityLog, Subscription
from schemas import RegistrationDecision, UnitCreate, UnitUpdateStatus, AdminCreate, AdminUpdate
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
            if not user and req.document_id:
                req_digits = re.sub(r"\D", "", req.document_id)
                for u in db.query(User).all():
                    if u.document_id and re.sub(r"\D", "", u.document_id) == req_digits:
                        user = u
                        break
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
        else:
            # Si no hay req en DB pero sí recipient_email
            user = db.query(User).filter(User.email.ilike(recipient_email)).first()
            if user:
                user.status = "approved"
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

    # Buscar todos los usuarios asociados por id, email, document_id o unidad
    users = db.query(User).filter(
        (User.id == identifier) |
        (User.email.ilike(identifier)) |
        (User.document_id == identifier) |
        (User.unit == clean_id)
    ).all()

    names = []
    for u in users:
        names.append(u.name)
        # Eliminar también solicitudes de registro asociadas a este residente
        reqs = db.query(RegistrationRequest).filter(
            (RegistrationRequest.document_id == u.document_id) |
            (RegistrationRequest.email == u.email) |
            (RegistrationRequest.unit == u.unit)
        ).all()
        for r in reqs:
            db.delete(r)
        db.delete(u)

    # Eliminar solicitudes sueltas para esa unidad
    extra_reqs = db.query(RegistrationRequest).filter(
        (RegistrationRequest.unit == clean_id) |
        (RegistrationRequest.unit == identifier)
    ).all()
    for r in extra_reqs:
        db.delete(r)

    # Liberar la unidad (marcar como 'available')
    unit = db.query(Unit).filter(
        (Unit.number == clean_id) |
        (Unit.id == f"unit-{clean_id.lower().replace(' ', '-')}") |
        (Unit.id == f"apt-{clean_id.lower().replace(' ', '-')}") |
        (Unit.id == f"ph-{clean_id.lower().replace(' ', '-')}")
    ).first()
    if unit:
        unit.status = "available"
        unit.status_label = "Disponible"

    user_label = ", ".join(names) if names else f"Unidad {clean_id}"

    # Registrar en bitácora de auditoría
    db.add(ActivityLog(
        title=f"Residente desvinculado: {user_label} (Unidad {clean_id} liberada)",
        time="Hace un momento",
        activity_type="user"
    ))
    db.commit()

    return {
        "success": True,
        "message": f"Residente {user_label} desvinculado con éxito. La Unidad {clean_id} ahora está Disponible.",
        "unit": clean_id
    }

@router.post("/create-admin")
def create_admin(payload: AdminCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario con rol de Administrador.
    Permite a la administración crear nuevos administradores de forma segura.
    """
    clean_doc = payload.document_id.strip()
    clean_email = payload.email.strip().lower()

    # Validar duplicados
    existing = db.query(User).filter(
        (User.document_id == clean_doc) | (User.email.ilike(clean_email))
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un usuario o administrador con este documento ({clean_doc}) o correo ({clean_email})."
        )

    admin_id = f"usr-admin-{int(datetime.datetime.utcnow().timestamp())}"
    new_admin = User(
        id=admin_id,
        document_id=clean_doc,
        name=payload.name.strip(),
        email=clean_email,
        phone=payload.phone or "(809) 555-0100",
        role="admin",
        role_label="Administrador Condominal",
        unit="Admin",
        aliquot="0.00%",
        password_hash=payload.password,
        status="approved",
        avatar="AD",
        subscription_exempt=bool(payload.subscription_exempt)
    )
    db.add(new_admin)
    db.add(ActivityLog(
        title=f"Nuevo Administrador Creado: {payload.name.strip()}",
        time="Hace un momento",
        activity_type="user"
    ))
    db.commit()
    db.refresh(new_admin)

    return {
        "success": True,
        "message": f"Administrador '{payload.name}' creado exitosamente.",
        "admin": {
            "id": new_admin.id,
            "name": new_admin.name,
            "document_id": new_admin.document_id,
            "email": new_admin.email,
            "role": new_admin.role,
            "subscription_exempt": new_admin.subscription_exempt
        }
    }

@router.get("/administrators")
def get_administrators(db: Session = Depends(get_db)):
    """
    Retorna la lista completa de usuarios con rol administrativo para el Super Administrador.
    """
    admin_users = db.query(User).filter(User.role.in_(["admin", "superadmin"])).all()
    
    # Asegurar que la cuenta maestra y la de gerencia demo estén representadas
    has_super = any(u.email.lower() == "admin@jardinesdelcerro.do" for u in admin_users)
    has_gerencia = any(u.email.lower() == "gerencia@jardinesdelcerro.do" for u in admin_users)

    results = []

    # 1. Super Administrador Maestro
    if not has_super:
        results.append({
            "id": "usr-superadmin",
            "name": "Super Administrador (Desarrollador)",
            "document_id": "034-0000001-0",
            "email": "admin@jardinesdelcerro.do",
            "phone": "(809) 555-0100",
            "role": "superadmin",
            "role_label": "Super Administrador (Desarrollador)",
            "status": "approved",
            "is_superadmin": True,
            "subscription_exempt": True,
            "subscription_status": "Exento Permanente (Bypass)",
            "created_at": "01 Ene 2025",
            "last_login": "En Línea Ahora"
        })

    for u in admin_users:
        is_super = (u.email.lower() == "admin@jardinesdelcerro.do" or u.role == "superadmin" or u.id == "usr-admin")
        
        # Verificar suscripción en tabla de suscripciones
        sub = db.query(Subscription).filter(
            Subscription.context == "admin",
            Subscription.status == "active",
            Subscription.user_id.in_([u.id, u.email])
        ).first()

        sub_exempt = getattr(u, "subscription_exempt", False) or is_super

        sub_label = "Exento Permanente (Bypass)" if is_super else (
            "Exonerado por SuperAdmin (Cortesía)" if sub_exempt else (
                f"Suscripción Activa ({sub.paypal_sub_id})" if sub else "Suscripción Requerida (Bloqueado)"
            )
        )

        results.append({
            "id": u.id,
            "name": u.name,
            "document_id": u.document_id,
            "email": u.email,
            "phone": u.phone or "(809) 555-0100",
            "role": "superadmin" if is_super else "admin",
            "role_label": "Super Administrador (Desarrollador)" if is_super else (u.role_label or "Administrador Condominal"),
            "status": u.status or "approved",
            "is_superadmin": is_super,
            "subscription_exempt": sub_exempt,
            "has_active_subscription": bool(sub) or sub_exempt,
            "subscription_status": sub_label,
            "created_at": u.created_at.strftime("%d %b %Y") if getattr(u, "created_at", None) else "2025",
            "last_login": "Reciente"
        })

    # Si gerencia demo no está en la base de datos, agregarla para auditoría
    if not has_gerencia:
        results.append({
            "id": "usr-admin-gerencia",
            "name": "Lic. Fernando Morales",
            "document_id": "034-0009999-1",
            "email": "gerencia@jardinesdelcerro.do",
            "phone": "(809) 555-0188",
            "role": "admin",
            "role_label": "Administrador Condominal Regular",
            "status": "approved",
            "is_superadmin": False,
            "subscription_exempt": False,
            "has_active_subscription": False,
            "subscription_status": "Suscripción Requerida (Bloqueado)",
            "created_at": "15 Feb 2025",
            "last_login": "Ayer"
        })

    return results

@router.put("/administrators/{admin_id}")
def update_administrator(admin_id: str, payload: AdminUpdate, db: Session = Depends(get_db)):
    """
    Actualiza datos de un administrador (nombre, correo, teléfono, estado o exención de pago).
    """
    user = db.query(User).filter(User.id == admin_id).first()
    if not user:
        # Si es un ID virtual (como usr-admin-gerencia), crear o actualizar
        if admin_id in ["usr-admin-gerencia", "usr-admin-regular"]:
            user = db.query(User).filter(User.email == "gerencia@jardinesdelcerro.do").first()
        if not user:
            raise HTTPException(status_code=404, detail="Administrador no encontrado en el sistema.")

    if payload.name:
        user.name = payload.name.strip()
    if payload.email:
        user.email = payload.email.strip().lower()
    if payload.phone:
        user.phone = payload.phone.strip()
    if payload.status:
        user.status = payload.status
    if payload.password:
        user.password_hash = payload.password
    if payload.subscription_exempt is not None:
        user.subscription_exempt = bool(payload.subscription_exempt)

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": f"Administrador '{user.name}' actualizado exitosamente.",
        "admin": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "status": user.status,
            "subscription_exempt": getattr(user, "subscription_exempt", False)
        }
    }

@router.delete("/administrators/{admin_id}")
def delete_administrator(admin_id: str, db: Session = Depends(get_db)):
    """
    Elimina un administrador (protegiendo permanentemente la cuenta del Super Administrador).
    """
    user = db.query(User).filter(User.id == admin_id).first()
    if not user:
        if admin_id in ["usr-superadmin", "usr-admin"]:
            raise HTTPException(status_code=400, detail="No es posible eliminar la cuenta principal de Super Administrador.")
        return {"success": True, "message": "Administrador retirado de la lista."}

    if user.email.lower() == "admin@jardinesdelcerro.do" or user.id in ["usr-admin", "usr-superadmin"]:
        raise HTTPException(status_code=400, detail="⛔ Acción bloqueada: No se puede eliminar al Super Administrador maestro del sistema.")

    admin_name = user.name
    db.delete(user)
    db.commit()

    return {
        "success": True,
        "message": f"Administrador '{admin_name}' eliminado del sistema correctamente."
    }

@router.post("/administrators/{admin_id}/toggle-exemption")
def toggle_admin_exemption(admin_id: str, db: Session = Depends(get_db)):
    """
    Alterna la exención de suscripción para un administrador regular.
    """
    user = db.query(User).filter(User.id == admin_id).first()
    if not user:
        if admin_id in ["usr-admin-gerencia", "usr-admin-regular"]:
            user = db.query(User).filter(User.email == "gerencia@jardinesdelcerro.do").first()
    
    if not user:
        return {"success": True, "exempt": True, "message": "Exención alternada en registro virtual."}

    current = getattr(user, "subscription_exempt", False)
    user.subscription_exempt = not current
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "exempt": user.subscription_exempt,
        "message": f"Exención de suscripción {'ACTIVADA' if user.subscription_exempt else 'REVOCADA'} para {user.name}."
    }


