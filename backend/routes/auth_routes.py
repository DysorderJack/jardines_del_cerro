import os
import shutil
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import User, RegistrationRequest, ActivityLog
from schemas import LoginRequest, UserResponse
from config import UPLOAD_DIR

router = APIRouter(prefix="/api/auth", tags=["Autenticación & Registro"])

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Inicio de sesión para Administrador o Residente (Propietario / Inquilino).
    """
    doc = payload.document_id.strip()
    
    # Manejo especial para admin con credenciales por defecto
    if doc.lower() in ["admin", "admin@jardinesdelcerro.do", "034-0000001-0"]:
        admin_user = db.query(User).filter(User.role == "admin").first()
        if admin_user and (payload.password == admin_user.password_hash or payload.password in ["admin123", "1234"]):
            return {
                "success": True,
                "token": "token-admin-session-live",
                "user": {
                    "id": admin_user.id,
                    "name": admin_user.name,
                    "document_id": admin_user.document_id,
                    "email": admin_user.email,
                    "role": "admin",
                    "role_label": "Administrador Condominal",
                    "unit": "Admin",
                    "status": "approved"
                }
            }

    # Búsqueda de residente en base de datos
    user = db.query(User).filter(
        (User.document_id == doc) | (User.email.ilike(doc))
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario o cédula no encontrada en el padrón.")

    if user.password_hash and user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")

    if user.status != "approved":
        raise HTTPException(
            status_code=403,
            detail=f"Tu cuenta se encuentra en estado '{user.status}'. Esperando aprobación de contrato por administración."
        )

    return {
        "success": True,
        "token": f"token-user-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "document_id": user.document_id,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "role_label": user.role_label,
            "unit": user.unit,
            "aliquot": user.aliquot,
            "status": user.status,
            "avatar": user.avatar
        }
    }

@router.post("/register")
async def register(
    full_name: str = Form(...),
    document_id: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    unit: str = Form(...),
    role: str = Form(...), # 'owner' o 'tenant'
    contract_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Registro formal de Propietario o Inquilino con subida física de Contrato Notariado en PDF.
    Cumple con el Punto 16.4 del Diseño de Sistemas.
    """
    clean_doc = document_id.strip()
    clean_email = email.strip().lower()

    # Verificar si el usuario ya existe
    existing = db.query(User).filter(
        (User.document_id == clean_doc) | (User.email == clean_email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Esta cédula o correo ya se encuentra registrado.")

    # Guardar archivo de contrato si fue adjuntado
    saved_filename = "Contrato_Notariado_Pendiente.pdf"
    if contract_file and contract_file.filename:
        ext = os.path.splitext(contract_file.filename)[1] or ".pdf"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"Contrato_{clean_doc.replace('-', '')}_{timestamp}{ext}"
        dest_path = UPLOAD_DIR / safe_name
        
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(contract_file.file, buffer)
        saved_filename = safe_name

    role_label = "Propietario Adquirente" if role == "owner" else "Inquilino Arrendatario"
    aliquot = "4.65%" if role == "owner" else "0.00%"
    initials = "".join([n[0] for n in full_name.split()[:2]]).upper() or "US"

    # 1. Crear solicitud para auditoría del administrador
    req_id = f"SOL-2026-{int(datetime.now().timestamp()) % 1000:03d}"
    new_request = RegistrationRequest(
        id=req_id,
        applicant_name=full_name,
        document_id=clean_doc,
        email=clean_email,
        phone=phone,
        unit=unit,
        role_requested=role,
        role_label=role_label,
        contract_filename=saved_filename,
        contract_date=datetime.now().strftime("%d %b %Y"),
        status="pending",
        notes=f"Solicitud radicada en línea con contrato {saved_filename}."
    )
    db.add(new_request)

    # 2. Crear usuario en estado pendiente
    new_user = User(
        id=f"usr-{unit.lower()}-{int(datetime.now().timestamp()) % 10000}",
        document_id=clean_doc,
        name=full_name,
        email=clean_email,
        phone=phone,
        role=role,
        role_label=role_label,
        unit=unit,
        aliquot=aliquot,
        password_hash="1234",
        status="pending",
        avatar=initials
    )
    db.add(new_user)

    # 3. Registrar actividad en bitácora
    log = ActivityLog(
        title=f"Nueva solicitud de acceso: {full_name} ({role_label}) para Unidad {unit}",
        time="Hace un momento",
        activity_type="user"
    )
    db.add(log)

    db.commit()

    return {
        "success": True,
        "message": "Solicitud de acceso enviada correctamente. El administrador auditará el contrato notariado.",
        "request_id": req_id,
        "contract_file": saved_filename
    }

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Retorna el padrón de usuarios registrados."""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "document_id": u.document_id,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "role_label": u.role_label,
            "unit": u.unit,
            "aliquot": u.aliquot,
            "status": u.status,
            "avatar": u.avatar
        }
        for u in users
    ]
