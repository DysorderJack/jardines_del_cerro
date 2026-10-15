import os
import shutil
import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import User, Unit, RegistrationRequest, ActivityLog
from schemas import LoginRequest, UserResponse, UserProfileUpdate, ChangePasswordRequest
from config import UPLOAD_DIR

router = APIRouter(prefix="/api/auth", tags=["Autenticación & Registro"])

def serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "document_id": u.document_id,
        "email": u.email,
        "phone": u.phone or "",
        "role": u.role,
        "role_label": u.role_label,
        "unit": u.unit or "",
        "aliquot": u.aliquot or "0.00%",
        "status": u.status,
        "avatar": u.avatar or "US",
        "avatar_url": u.avatar_url,
        "emergency_contact": u.emergency_contact or "",
        "emergency_phone": u.emergency_phone or "",
        "vehicle_plate": u.vehicle_plate or "",
        "vehicle_model": u.vehicle_model or "",
        "official_title": u.official_title or "",
        "notify_email": u.notify_email if u.notify_email is not None else True,
        "notify_whatsapp": u.notify_whatsapp if u.notify_whatsapp is not None else True,
        "subscription_exempt": u.subscription_exempt or False,
        "is_superadmin": (u.role == "superadmin" or (u.email and u.email.lower() == "admin@jardinesdelcerro.do"))
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Inicio de sesión para Administrador o Residente (Propietario / Inquilino).
    """
    doc = payload.document_id.strip()
    
    # Manejo especial para admin con credenciales maestras (Super Administrador / Programador)
    if doc.lower() in ["admin", "admin@jardinesdelcerro.do", "034-0000001-0"]:
        admin_user = db.query(User).filter(User.role == "admin").first()
        valid_passwords = ["admin123", "1234"]
        if admin_user and admin_user.password_hash:
            valid_passwords.append(admin_user.password_hash)
        if payload.password in valid_passwords:
            return {
                "success": True,
                "token": "token-admin-session-live",
                "user": {
                    "id": admin_user.id if admin_user else "usr-superadmin",
                    "name": "Super Administrador (Desarrollador)",
                    "document_id": admin_user.document_id if admin_user else "034-0000001-0",
                    "email": "admin@jardinesdelcerro.do",
                    "role": "superadmin",
                    "role_label": "Super Administrador (Desarrollador)",
                    "unit": "Admin",
                    "status": "approved",
                    "is_superadmin": True,
                    "subscription_exempt": True
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Contraseña incorrecta de administrador.")

    # Manejo de Administrador Regular de Demostración (Requiere Suscripción SaaS)
    if doc.lower() == "gerencia@jardinesdelcerro.do" and payload.password == "admin123":
        return {
            "success": True,
            "token": "token-admin-regular-live",
            "user": {
                "id": "usr-admin-regular",
                "name": "Lic. Fernando Morales (Gerencia)",
                "document_id": "034-0009999-1",
                "email": "gerencia@jardinesdelcerro.do",
                "role": "admin",
                "role_label": "Administrador Condominal Regular",
                "unit": "Admin",
                "status": "approved",
                "is_superadmin": False,
                "subscription_exempt": False
            }
        }

    # Búsqueda de residente en base de datos (por email, documento exacto o normalizado)
    doc_digits = re.sub(r"\D", "", doc)
    user = db.query(User).filter(
        (User.document_id == doc) | (User.email.ilike(doc))
    ).first()

    if not user and doc_digits:
        for u in db.query(User).all():
            if u.document_id and re.sub(r"\D", "", u.document_id) == doc_digits:
                user = u
                break

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
        "user": serialize_user(user)
    }

@router.post("/register")
async def register(
    full_name: str = Form(...),
    document_id: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    unit: str = Form(...),
    role: str = Form(...), # 'owner' o 'tenant'
    password: Optional[str] = Form(None),
    contract_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Registro formal de Propietario o Inquilino con validaciones estrictas:
    1. Cédula y correo no duplicados (en padrón activo y solicitudes pendientes).
    2. Documento físico de contrato notariado obligatorio (PDF o Imagen).
    3. Contraseña segura (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo).
    Cumple con el Punto 16.3 y 16.4 del Diseño de Sistemas.
    """
    clean_doc = document_id.strip()
    clean_email = email.strip().lower()

    # 1. Validación de unicidad de Cédula y Correo en usuarios registrados
    existing_user = db.query(User).filter(
        (User.document_id.ilike(clean_doc)) | (User.email.ilike(clean_email))
    ).first()
    if existing_user:
        if existing_user.document_id.lower() == clean_doc.lower():
            raise HTTPException(
                status_code=400,
                detail=f"La cédula o identificación '{clean_doc}' ya se encuentra registrada en el padrón del condominio."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"El correo electrónico '{clean_email}' ya se encuentra registrado en el sistema."
            )

    # 2. Validación de Cédula y Correo en solicitudes pendientes
    existing_req = db.query(RegistrationRequest).filter(
        ((RegistrationRequest.document_id.ilike(clean_doc)) | (RegistrationRequest.email.ilike(clean_email))) &
        (RegistrationRequest.status == "pending")
    ).first()
    if existing_req:
        if existing_req.document_id.lower() == clean_doc.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una solicitud pendiente de aprobación (ID: {existing_req.id}) para la cédula '{clean_doc}'."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una solicitud pendiente de aprobación para el correo '{clean_email}'."
            )

    # 2.5 Validación: Unidad disponible (no ocupada por un residente aprobado)
    clean_unit = unit.replace("Unidad", "").replace("unidad", "").strip()
    occupied_resident = db.query(User).filter(
        ((User.unit == unit) | (User.unit == clean_unit)) &
        (User.status == "approved")
    ).first()
    if occupied_resident:
        raise HTTPException(
            status_code=400,
            detail=f"La Unidad {unit} ya se encuentra ocupada por un residente activo. Por favor selecciona una unidad disponible."
        )

    occupied_unit = db.query(Unit).filter(
        ((Unit.number == unit) | (Unit.number == clean_unit)) &
        (Unit.status == "occupied")
    ).first()
    if occupied_unit:
        raise HTTPException(
            status_code=400,
            detail=f"La Unidad {unit} ya se encuentra ocupada en el sistema. Por favor selecciona una unidad disponible."
        )

    # 3. Validación obligatoria de subida física de contrato
    if not contract_file or not contract_file.filename or len(contract_file.filename.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Es obligatorio adjuntar el archivo físico del contrato notariado (PDF o Imagen)."
        )

    allowed_exts = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(contract_file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de archivo inválido ('{ext}'). Solo se aceptan documentos en formato PDF, JPG, PNG o WEBP."
        )

    # 4. Validación de contraseña segura
    clean_pass = (password or "").strip()
    if not clean_pass:
        raise HTTPException(
            status_code=400,
            detail="Debes especificar una contraseña segura para tu cuenta."
        )

    if len(clean_pass) < 8:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 8 caracteres."
        )

    if not re.search(r"[A-Z]", clean_pass):
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe contener al menos una letra mayúscula (A-Z)."
        )

    if not re.search(r"[a-z]", clean_pass):
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe contener al menos una letra minúscula (a-z)."
        )

    if not re.search(r"\d", clean_pass):
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe contener al menos un número (0-9)."
        )

    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", clean_pass):
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe contener al menos un carácter especial (!, @, #, $, %, &, *, etc.)."
        )

    # Guardar archivo físico en el servidor
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

    # 2. Crear usuario en estado pendiente con la contraseña provista
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
        password_hash=clean_pass,
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
    """Retorna el padrón de usuarios registrados con sus datos de perfil."""
    users = db.query(User).all()
    return [serialize_user(u) for u in users]

# =========================================================================
# GESTIÓN DE CUENTA Y PERFIL (ADMINISTRADOR & RESIDENTE)
# =========================================================================

def find_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    clean_id = (identifier or "").strip()
    if not clean_id:
        return None
    
    # 1. Por ID directo
    u = db.query(User).filter(User.id == clean_id).first()
    if u:
        return u
        
    # 2. Por Email
    u = db.query(User).filter(User.email.ilike(clean_id)).first()
    if u:
        return u
        
    # 3. Por Cédula exacta
    u = db.query(User).filter(User.document_id == clean_id).first()
    if u:
        return u
        
    # 4. Por Cédula normalizada (solo dígitos)
    digits = re.sub(r"\D", "", clean_id)
    if digits:
        for user_item in db.query(User).all():
            if user_item.document_id and re.sub(r"\D", "", user_item.document_id) == digits:
                return user_item
                
    # 5. Manejo especial de super administrador
    if clean_id.lower() in ["admin", "superadmin", "usr-superadmin", "admin@jardinesdelcerro.do"]:
        u = db.query(User).filter(User.role == "admin").first()
        if u:
            return u
            
    return None

@router.get("/profile/{identifier}")
def get_user_profile(identifier: str, db: Session = Depends(get_db)):
    """Obtiene los datos completos de perfil de un residente o administrador."""
    user = find_user_by_identifier(db, identifier)
    if not user:
        if identifier.lower() in ["admin", "admin@jardinesdelcerro.do", "usr-superadmin"]:
            return {
                "success": True,
                "user": {
                    "id": "usr-superadmin",
                    "name": "Super Administrador (Desarrollador)",
                    "document_id": "034-0000001-0",
                    "email": "admin@jardinesdelcerro.do",
                    "phone": "(809) 555-0100",
                    "role": "superadmin",
                    "role_label": "Super Administrador (Desarrollador)",
                    "unit": "Admin",
                    "aliquot": "100.0%",
                    "status": "approved",
                    "avatar": "SA",
                    "avatar_url": None,
                    "emergency_contact": "",
                    "emergency_phone": "",
                    "vehicle_plate": "",
                    "vehicle_model": "",
                    "official_title": "Desarrollador & Super Administrador",
                    "notify_email": True,
                    "notify_whatsapp": True,
                    "subscription_exempt": True,
                    "is_superadmin": True
                }
            }
        raise HTTPException(status_code=404, detail="Usuario no encontrado en el sistema.")
    return {"success": True, "user": serialize_user(user)}

@router.put("/profile/{identifier}")
def update_user_profile(identifier: str, payload: UserProfileUpdate, db: Session = Depends(get_db)):
    """
    Actualiza datos del perfil: correo, teléfono, datos de emergencia, vehículos o título oficial.
    Valida unicidad de correo.
    """
    user = find_user_by_identifier(db, identifier)
    if not user:
        if identifier.lower() in ["admin", "admin@jardinesdelcerro.do", "usr-superadmin"]:
            user = User(
                id="usr-admin",
                document_id="034-0000001-0",
                name="Super Administrador (Desarrollador)",
                email="admin@jardinesdelcerro.do",
                phone="(809) 555-0100",
                role="admin",
                role_label="Super Administrador (Desarrollador)",
                unit="Admin",
                aliquot="100.0%",
                password_hash="admin123",
                status="approved",
                avatar="SA",
                subscription_exempt=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # 1. Validación de nuevo correo electrónico
    if payload.email is not None and payload.email.strip():
        new_email = payload.email.strip().lower()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", new_email):
            raise HTTPException(status_code=400, detail="Formato de correo electrónico inválido.")
        
        # Verificar unicidad (que ningún otro usuario tenga este correo)
        existing = db.query(User).filter(User.email.ilike(new_email), User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado por otro usuario en el condominio.")
        user.email = new_email

    # 2. Nombre
    if payload.name is not None and payload.name.strip():
        user.name = payload.name.strip()
        if not user.avatar_url:
            parts = user.name.split()
            user.avatar = ("".join([p[0] for p in parts[:2]])).upper() or "US"

    # 3. Teléfono
    if payload.phone is not None:
        user.phone = payload.phone.strip()

    # 4. Avatar URL
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url

    # 5. Contacto de Emergencia
    if payload.emergency_contact is not None:
        user.emergency_contact = payload.emergency_contact.strip()
    if payload.emergency_phone is not None:
        user.emergency_phone = payload.emergency_phone.strip()

    # 6. Placas y Vehículo
    if payload.vehicle_plate is not None:
        user.vehicle_plate = payload.vehicle_plate.strip().upper()
    if payload.vehicle_model is not None:
        user.vehicle_model = payload.vehicle_model.strip()

    # 7. Cargo / Título Oficial (Admin)
    if payload.official_title is not None:
        user.official_title = payload.official_title.strip()

    # 8. Notificaciones
    if payload.notify_email is not None:
        user.notify_email = payload.notify_email
    if payload.notify_whatsapp is not None:
        user.notify_whatsapp = payload.notify_whatsapp

    # Registrar en bitácora de actividad
    log = ActivityLog(
        title=f"Perfil actualizado: {user.name} ({user.email})",
        activity_type="user"
    )
    db.add(log)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Información de perfil actualizada exitosamente.",
        "user": serialize_user(user)
    }

@router.put("/change-password/{identifier}")
def change_password(identifier: str, payload: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Permite al usuario cambiar su contraseña validando la contraseña actual."""
    user = find_user_by_identifier(db, identifier)
    if not user:
        if identifier.lower() in ["admin", "admin@jardinesdelcerro.do", "usr-superadmin"]:
            user = db.query(User).filter(User.role == "admin").first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario de administración no inicializado.")
        else:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Validar contraseña actual
    current_pass = (payload.current_password or "").strip()
    valid_curr = [user.password_hash or "1234"]
    if user.role in ["admin", "superadmin"] or user.email == "admin@jardinesdelcerro.do":
        valid_curr.extend(["admin123", "1234"])

    if current_pass not in valid_curr:
        raise HTTPException(status_code=400, detail="La contraseña actual ingresada es incorrecta.")

    new_pass = (payload.new_password or "").strip()
    if len(new_pass) < 4:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 4 caracteres.")

    if new_pass == current_pass:
        raise HTTPException(status_code=400, detail="La nueva contraseña no puede ser idéntica a la anterior.")

    user.password_hash = new_pass

    log = ActivityLog(
        title=f"Cambio de contraseña exitoso para {user.name}",
        activity_type="security"
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Contraseña actualizada exitosamente."
    }

@router.post("/upload-avatar/{identifier}")
async def upload_avatar(
    identifier: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Sube y actualiza la foto de perfil del usuario."""
    user = find_user_by_identifier(db, identifier)
    if not user:
        if identifier.lower() in ["admin", "admin@jardinesdelcerro.do", "usr-superadmin"]:
            user = db.query(User).filter(User.role == "admin").first()
            if not user:
                user = User(
                    id="usr-admin",
                    document_id="034-0000001-0",
                    name="Super Administrador (Desarrollador)",
                    email="admin@jardinesdelcerro.do",
                    phone="(809) 555-0100",
                    role="admin",
                    role_label="Super Administrador (Desarrollador)",
                    unit="Admin",
                    aliquot="100.0%",
                    password_hash="admin123",
                    status="approved",
                    avatar="SA",
                    subscription_exempt=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        else:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No se recibió ningún archivo de imagen.")

    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Formato inválido. Solo se admiten imágenes JPG, PNG o WEBP.")

    avatars_dir = UPLOAD_DIR / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"avatar_{re.sub(r'[^a-zA-Z0-9]', '', user.id)}_{timestamp}{ext}"
    dest_path = avatars_dir / safe_name

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user.avatar_url = f"/uploads/avatars/{safe_name}"
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "avatar_url": user.avatar_url,
        "user": serialize_user(user)
    }

@router.delete("/avatar/{identifier}")
def delete_avatar(identifier: str, db: Session = Depends(get_db)):
    """Elimina la foto personalizada de perfil para volver a usar las iniciales."""
    user = find_user_by_identifier(db, identifier)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    user.avatar_url = None
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Foto de perfil eliminada correctamente.",
        "user": serialize_user(user)
    }

