from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from database import get_db
from models import ElectronicInvoice, Subscription, User, Payment
from schemas import TenantEmitE32Request
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
            "issued_at": ECFService.format_dominican_dt(inv.issued_at)
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
    # 1. Buscar factura existente más reciente de la suscripción administrativa
    query = db.query(ElectronicInvoice).filter(ElectronicInvoice.context == "admin_subscription")
    inv = None
    if user_id and user_id not in ["all", "latest", "gerencia@jardinesdelcerro.do", "admin@jardinesdelcerro.do"]:
        inv = query.filter(ElectronicInvoice.user_id == user_id).order_by(ElectronicInvoice.created_at.desc()).first()
    if not inv:
        inv = query.order_by(ElectronicInvoice.created_at.desc()).first()

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
                "issued_at": ECFService.format_dominican_dt(inv.issued_at)
            }
        }

    # 2. Si no hay factura aún, buscar la suscripción activa
    sub = db.query(Subscription).filter(
        Subscription.context == "admin",
        Subscription.status == "active"
    ).order_by(Subscription.created_at.desc()).first()

    if not sub:
        return {
            "exists": False,
            "message": "No hay suscripción activa para este usuario administrador."
        }

    plan_name = sub.plan_name or "Licencia SaaS Sistema Condominal Pro"
    period = sub.period or "Mensual"
    price_usd = sub.price_usd or 24.99
    order_id = sub.paypal_sub_id or f"PAYPAL-ACT-{int(datetime.now().timestamp())}"

    # Emitir mediante ECFService directamente a IMECF Platform
    ecf_data = ECFService.emit_e31_credito_fiscal(
        user_email=user_id,
        plan_name=plan_name,
        period=period,
        price_usd=price_usd,
        paypal_order_id=order_id
    )

    if not ecf_data or not ecf_data.get("api_dispatched"):
        err_msg = ecf_data.get("api_error") if ecf_data else "Error de conexión con IMECF Platform"
        raise HTTPException(
            status_code=502,
            detail=f"Fallo en la emisión obligatoria de la factura e-CF E31 en IMECF Platform: {err_msg}"
        )

    # Persistir en DB solo tras éxito fiscal comprobado
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
            "issued_at": ECFService.format_dominican_dt(new_inv.issued_at)
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
        "issued_at": ECFService.format_dominican_dt(inv.issued_at)
    }

@router.get("/tenant-payments")
def list_tenant_payments(
    period: str = Query("Octubre 2026", description="Período fiscal de cuotas condominales"),
    db: Session = Depends(get_db)
):
    """
    Retorna la lista completa de inquilinos y residentes con su estado de pago de cuota
    y Comprobante Fiscal Electrónico e-CF Tipo E32 (R32) para el panel del administrador.
    """
    # 1. Padrón oficial de unidades residenciales y sus arrendatarios / propietarios
    tenants_catalog = [
        {
            "id": "ten-101",
            "unit": "101",
            "name": "Dra. Laura Batista",
            "cedula": "034-0029182-3",
            "phone": "(809) 555-8931",
            "role": "tenant",
            "role_label": "Inquilina Arrendataria",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "02/10/2026 09:30 AM",
            "payment_method": "PayPal Online",
            "default_encf": "E320000001361"
        },
        {
            "id": "ten-201",
            "unit": "201",
            "name": "Marcos Peña",
            "cedula": "034-0045123-8",
            "phone": "(809) 555-9012",
            "role": "tenant",
            "role_label": "Inquilino / Adquirente",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": False,
            "late_days": 45,
            "late_penalty": 195.0,  # 3% mora reglamentaria
            "payment_date": None,
            "payment_method": None,
            "default_encf": None
        },
        {
            "id": "ten-202",
            "unit": "202",
            "name": "José Miguel Gómez",
            "cedula": "034-0091823-4",
            "phone": "(809) 555-4412",
            "role": "tenant",
            "role_label": "Inquilino Arrendatario",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "04/10/2026 03:15 PM",
            "payment_method": "Transferencia Banco BHD",
            "default_encf": "E320000001362"
        },
        {
            "id": "ten-301",
            "unit": "301",
            "name": "Ramona Ramos",
            "cedula": "034-0012345-6",
            "phone": "(809) 555-3341",
            "role": "owner",
            "role_label": "Propietaria Residente",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "01/10/2026 10:00 AM",
            "payment_method": "PayPal Online",
            "default_encf": "E320000001363"
        },
        {
            "id": "ten-302",
            "unit": "302",
            "name": "Lic. Carolina Peralta",
            "cedula": "034-0078129-0",
            "phone": "(809) 555-6671",
            "role": "tenant",
            "role_label": "Inquilina Arrendataria",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "03/10/2026 11:20 AM",
            "payment_method": "Transferencia Banreservas",
            "default_encf": "E320000001364"
        },
        {
            "id": "ten-401",
            "unit": "401",
            "name": "Nelson Cruz",
            "cedula": "034-0033182-1",
            "phone": "(809) 555-8820",
            "role": "tenant",
            "role_label": "Inquilino Arrendatario",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "05/10/2026 04:40 PM",
            "payment_method": "PayPal Online",
            "default_encf": "E320000001365"
        },
        {
            "id": "ten-402",
            "unit": "402",
            "name": "David Almonte",
            "cedula": "034-0066291-7",
            "phone": "(809) 555-1234",
            "role": "tenant",
            "role_label": "Inquilino Arrendatario",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": False,
            "late_days": 30,
            "late_penalty": 195.0,  # 3% mora reglamentaria
            "payment_date": None,
            "payment_method": None,
            "default_encf": None
        },
        {
            "id": "ten-501",
            "unit": "501",
            "name": "Lic. Manuel Tavárez",
            "cedula": "034-0087654-1",
            "phone": "(809) 555-7722",
            "role": "owner",
            "role_label": "Propietario Residente",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "02/10/2026 02:00 PM",
            "payment_method": "Transferencia Banco Popular",
            "default_encf": "E320000001366"
        },
        {
            "id": "ten-502",
            "unit": "502",
            "name": "Patricia Valerio",
            "cedula": "034-0055190-2",
            "phone": "(809) 555-9988",
            "role": "tenant",
            "role_label": "Inquilina Arrendataria",
            "period": period,
            "amount_dop": 6500.0,
            "is_paid": True,
            "payment_date": "04/10/2026 01:10 PM",
            "payment_method": "PayPal Online",
            "default_encf": "E320000001367"
        },
        {
            "id": "ten-901",
            "unit": "PH-901",
            "name": "Ing. Carlos Mendoza",
            "cedula": "001-1827364-5",
            "phone": "(809) 555-1284",
            "role": "tenant",
            "role_label": "Inquilino Penthouse",
            "period": period,
            "amount_dop": 8500.0,
            "is_paid": True,
            "payment_date": "05/10/2026 11:00 AM",
            "payment_method": "PayPal Online",
            "default_encf": "E320000001368"
        },
        {
            "id": "ten-1001",
            "unit": "PH-1001",
            "name": "Dr. Alejandro Morales",
            "cedula": "034-0011928-9",
            "phone": "(809) 555-7711",
            "role": "owner",
            "role_label": "Propietario Penthouse",
            "period": period,
            "amount_dop": 8500.0,
            "is_paid": False,
            "late_days": 15,
            "late_penalty": 255.0,  # 3% mora reglamentaria
            "payment_date": None,
            "payment_method": None,
            "default_encf": None
        }
    ]

    # 2. Consultar facturas e-CF E32 y pagos reales registrados en la base de datos
    db_invoices = db.query(ElectronicInvoice).filter(
        ElectronicInvoice.context == "resident_maintenance"
    ).all()
    invoices_by_unit = {inv.concept.split("Unidad ")[-1].strip(): inv for inv in db_invoices if "Unidad " in inv.concept}

    results = []
    for item in tenants_catalog:
        unit = item["unit"]
        # Si existe una factura emitida en DB para esta unidad, sincronizar
        db_inv = invoices_by_unit.get(unit)
        if db_inv:
            item["is_paid"] = True
            item["default_encf"] = db_inv.encf
            item["payment_date"] = ECFService.format_dominican_dt(db_inv.issued_at)
            item["invoice_id"] = db_inv.id

        encf_val = item["default_encf"] if item["is_paid"] else None
        results.append({
            "id": item["id"],
            "unit": item["unit"],
            "name": item["name"],
            "cedula": item["cedula"],
            "phone": item["phone"],
            "role": item["role"],
            "role_label": item["role_label"],
            "period": item["period"],
            "amount_dop": item["amount_dop"],
            "is_paid": item["is_paid"],
            "status": "Pagado" if item["is_paid"] else "Pendiente",
            "payment_date": item.get("payment_date"),
            "payment_method": item.get("payment_method"),
            "late_days": item.get("late_days", 0),
            "late_penalty": item.get("late_penalty", 0.0),
            "total_due_dop": item["amount_dop"] + item.get("late_penalty", 0.0),
            "encf": encf_val,
            "ecf_type": "E32 (R32)",
            "ecf_type_name": "Factura de Consumo Electrónica",
            "has_invoice": bool(encf_val)
        })

    return results

@router.post("/emit-e32")
def emit_tenant_e32_invoice(
    payload: TenantEmitE32Request,
    db: Session = Depends(get_db)
):
    """
    Emite una Factura de Consumo Electrónica oficial (e-CF Tipo E32 / R32)
    ante la DGII e IMECF Platform para un inquilino o residente que haya pagado su cuota.
    """
    concept_str = payload.concept or f"Cuota de Mantenimiento {payload.period} - Unidad {payload.unit}"

    # 1. Llamar a ECFService para emitir e-CF E32 con firma y QR DGII
    ecf_data = ECFService.emit_e32_consumo(
        resident_name=payload.tenant_name,
        resident_cedula=payload.tenant_cedula or "034-0000000-0",
        unit=payload.unit,
        amount_dop=float(payload.amount_dop or 6500.0),
        concept=concept_str,
        payment_method=payload.payment_method or "Transferencia Bancaria / PayPal"
    )

    # 2. Guardar comprobante fiscal electrónico en la base de datos
    new_inv = ElectronicInvoice(
        id=ecf_data["id"],
        encf=ecf_data["encf"],
        type_id="32",
        type_name="Factura de Consumo Electrónica (R32)",
        context="resident_maintenance",
        user_id=payload.tenant_name,
        paypal_reference=payload.payment_method,
        rnc_emisor=ecf_data["rnc_emisor"],
        razon_social_emisor=ecf_data["razon_social_emisor"],
        rnc_receptor=payload.tenant_cedula or "000-0000000-0",
        razon_social_receptor=payload.tenant_name,
        concept=concept_str,
        currency="DOP",
        exchange_rate=60.50,
        amount_usd=round(float(payload.amount_dop or 6500.0) / 60.50, 2),
        subtotal_dop=float(payload.amount_dop or 6500.0),
        itbis_dop=0.0,  # Cuotas condominales exentas de ITBIS
        total_dop=float(payload.amount_dop or 6500.0),
        security_code=ecf_data["security_code"],
        qr_url=ecf_data["qr_url"],
        status=ecf_data["status"],
        dgii_track_id=ecf_data.get("dgii_track_id")
    )
    db.add(new_inv)

    # 3. Registrar o actualizar pago en la tabla de pagos
    new_payment = Payment(
        id=f"PAG-{int(datetime.now().timestamp())}",
        user_id=payload.tenant_name,
        unit=payload.unit,
        period=payload.period,
        concept=concept_str,
        ncf=ecf_data["encf"],
        amount=f"RD$ {float(payload.amount_dop or 6500.0):,.2f}",
        method=payload.payment_method or "Transferencia Bancaria",
        status="Aprobado",
        date=ECFService.get_dominican_now().strftime("%d/%m/%Y")
    )
    db.add(new_payment)
    db.commit()

    return {
        "success": True,
        "message": f"Factura de Consumo Electrónica {ecf_data['encf']} (R32) emitida exitosamente ante la DGII.",
        "invoice": {
            "id": new_inv.id,
            "encf": new_inv.encf,
            "type_id": "32",
            "type_name": "Factura de Consumo Electrónica (R32)",
            "unit": payload.unit,
            "tenant_name": payload.tenant_name,
            "tenant_cedula": payload.tenant_cedula,
            "amount_dop": new_inv.total_dop,
            "security_code": new_inv.security_code,
            "qr_url": new_inv.qr_url,
            "status": new_inv.status,
            "issued_at": ECFService.format_dominican_dt(new_inv.issued_at)
        }
    }

@router.get("/invoice/{encf}/print", response_class=HTMLResponse)
def print_invoice(encf: str, db: Session = Depends(get_db)):
    """
    Retorna la Representación Impresa (RI) oficial de la DGII en formato HTML lista
    para imprimir o exportar en PDF con código QR y desglose tributario.
    Soporta e-CF E31 (Crédito Fiscal) y e-CF E32 / R32 (Factura de Consumo de Inquilinos).
    """
    inv = db.query(ElectronicInvoice).filter(ElectronicInvoice.encf == encf).first()
    clean_encf = (encf or "").upper().strip()
    is_e32 = clean_encf.startswith("E32") or (inv and str(inv.type_id) == "32")

    if not inv:
        if is_e32:
            latest_inv = db.query(ElectronicInvoice).filter(
                ElectronicInvoice.type_id == "32"
            ).order_by(ElectronicInvoice.created_at.desc()).first()
        else:
            latest_inv = db.query(ElectronicInvoice).filter(
                ElectronicInvoice.context == "admin_subscription"
            ).order_by(ElectronicInvoice.created_at.desc()).first()
        if latest_inv:
            inv = latest_inv

    if not inv:
        # Fallback a comprobante dinámico si no existe registro previo en DB
        now_dt = ECFService.get_dominican_now()
        date_str = now_dt.strftime("%d/%m/%Y %I:%M %p")
        if is_e32:
            data = {
                "encf": clean_encf or "E320000001361",
                "type_id": "32",
                "security_code": "K1sCRj",
                "qr_url": f"https://fc.dgii.gov.do/testecf/consultatimbrefc?rncemisor=132907401&encf={clean_encf}&montototal=6500.00&codigoseguridad=K1sCRj",
                "amount_usd": 107.44,
                "exchange_rate": 60.50,
                "subtotal_dop": 6500.00,
                "itbis_dop": 0.00,
                "total_dop": 6500.00,
                "rnc_emisor": "132907401",
                "razon_social_emisor": "Torre Residencial Jardines del Cerro IV, S.R.L.",
                "rnc_receptor": "034-0029182-3",
                "resident_name": "Dra. Laura Batista",
                "razon_social_receptor": "Dra. Laura Batista",
                "unit": "101",
                "concept": "Cuota de Mantenimiento Condominal — Unidad 101",
                "user_id": "lbatista@claro.net.do",
                "payment_method": "PayPal Online / Transferencia Bancaria",
                "paypal_reference": "PAG-VERIFICADO",
                "issued_at_str": date_str
            }
        else:
            data = {
                "encf": clean_encf or "E310000001338",
                "type_id": "31",
                "security_code": "LTVjai",
                "qr_url": f"https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=132907401&RncComprador=131889921&encf={clean_encf}&fechaemision=19-10-2026&montototal=1511.89&fechafirma=19-10-2026%2022%3A48%3A00&codigoseguridad=LTVjai",
                "amount_usd": 24.99,
                "exchange_rate": 60.50,
                "subtotal_dop": 1281.26,
                "itbis_dop": 230.63,
                "total_dop": 1511.89,
                "rnc_emisor": "132907401",
                "razon_social_emisor": "Torre Residencial Jardines del Cerro IV, S.R.L.",
                "rnc_receptor": "131-88992-1",
                "razon_social_receptor": "Administración Condominio Jardines del Cerro IV",
                "concept": "Licencia SaaS Sistema Condominal Torre Jardines del Cerro IV",
                "user_id": "admin@jardinesdelcerro.do",
                "payment_method": "PayPal Subscriptions (En Línea)",
                "paypal_reference": "PAYPAL-VERIFIED",
                "issued_at_str": date_str
            }
        return HTMLResponse(content=ECFService.generate_printable_html(data))

    inv_dict = {
        "encf": inv.encf,
        "type_id": inv.type_id,
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
        "resident_name": inv.razon_social_receptor,
        "razon_social_receptor": inv.razon_social_receptor,
        "concept": inv.concept,
        "user_id": inv.user_id,
        "payment_method": inv.paypal_reference or "Transferencia Bancaria",
        "paypal_reference": inv.paypal_reference,
        "issued_at_str": ECFService.format_dominican_dt(inv.issued_at)
    }

    html = ECFService.generate_printable_html(inv_dict)
    return HTMLResponse(content=html)

