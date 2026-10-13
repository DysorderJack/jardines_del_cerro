import logging
from sqlalchemy.orm import Session
from models import User, Unit, RegistrationRequest, Payment, MaintenanceTicket, Subscription, ActivityLog, Visit

logger = logging.getLogger("seed_data")

def seed_database_if_empty(db: Session):
    """
    Inserta datos iniciales de la Torre Jardines del Cerro IV si la base de datos está vacía.
    """
    if db.query(User).first() is not None:
        return  # Ya está poblada

    logger.info("Inicializando datos semilla en la base de datos...")

    # 1. Usuarios Oficiales
    users = [
        User(
            id="usr-admin",
            document_id="034-0000001-0",
            name="Administración Jardines del Cerro IV",
            email="admin@jardinesdelcerro.do",
            phone="(809) 555-0100",
            role="admin",
            role_label="Administrador Condominal",
            unit="Admin",
            aliquot="100.0%",
            password_hash="admin123",
            status="approved",
            avatar="AD"
        ),
        User(
            id="usr-301",
            document_id="034-0012345-6",
            name="Ramona Ramos",
            email="ramona.ramos@gmail.com",
            phone="(809) 555-0142",
            role="owner",
            role_label="Propietaria Residente",
            unit="301",
            aliquot="4.65%",
            password_hash="1234",
            status="approved",
            avatar="RR"
        ),
        User(
            id="usr-501",
            document_id="034-0087654-1",
            name="Lic. Manuel Tavárez",
            email="mtavarez@gmail.com",
            phone="(809) 555-0199",
            role="owner",
            role_label="Propietario Residente",
            unit="501",
            aliquot="4.65%",
            password_hash="1234",
            status="approved",
            avatar="MT"
        ),
        User(
            id="usr-101",
            document_id="034-0029182-3",
            name="Dra. Laura Batista",
            email="lbatista@claro.net.do",
            phone="(809) 555-0188",
            role="tenant",
            role_label="Inquilina Arrendataria",
            unit="101",
            aliquot="0.00%",
            password_hash="1234",
            status="pending",
            avatar="LB"
        )
    ]
    for u in users:
        db.add(u)

    # 2. Inventario de Unidades
    units = [
        Unit(id="unit-101", number="101", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=1, status="available", status_label="Disponible", modality="both", modality_label="Compra y Alquiler", price="US$ 145,000 / RD$ 45,000 mes"),
        Unit(id="unit-102", number="102", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=1, status="available", status_label="Disponible", modality="purchase", modality_label="Solo Compra", price="Desde US$ 145,000"),
        Unit(id="unit-201", number="201", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=2, status="occupied", status_label="Ocupado", modality="purchase", modality_label="Solo Compra", price="US$ 148,000"),
        Unit(id="unit-202", number="202", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=2, status="available", status_label="Disponible", modality="purchase", modality_label="Solo Compra", price="Desde US$ 148,000"),
        Unit(id="unit-301", number="301", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=3, status="occupied", status_label="Ocupado", modality="both", modality_label="Compra y Alquiler", price="US$ 152,000"),
        Unit(id="unit-302", number="302", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=3, status="reserved", status_label="Reservado", modality="purchase", modality_label="Solo Compra", price="US$ 152,000"),
        Unit(id="unit-401", number="401", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=4, status="available", status_label="Disponible", modality="purchase", modality_label="Solo Compra", price="Desde US$ 156,000"),
        Unit(id="unit-402", number="402", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=4, status="occupied", status_label="Ocupado", modality="purchase", modality_label="Solo Compra", price="US$ 156,000"),
        Unit(id="unit-501", number="501", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=5, status="occupied", status_label="Ocupado", modality="purchase", modality_label="Solo Compra", price="US$ 160,000"),
        Unit(id="unit-502", number="502", unit_type="apartment", type_name="Apartamento", sqm=120, bedrooms=3, bathrooms=2, level=5, status="available", status_label="Disponible", modality="purchase", modality_label="Solo Compra", price="Desde US$ 160,000"),
        Unit(id="unit-ph-901", number="PH-901", unit_type="penthouse", type_name="Penthouse", sqm=170, bedrooms=3, bathrooms=3, level=9, status="reserved", status_label="Reservado", modality="purchase", modality_label="Solo Compra", price="US$ 215,000"),
        Unit(id="unit-ph-902", number="PH-902", unit_type="penthouse", type_name="Penthouse", sqm=170, bedrooms=3, bathrooms=3, level=9, status="available", status_label="Disponible", modality="purchase", modality_label="Solo Compra", price="Desde US$ 215,000")
    ]
    for un in units:
        db.add(un)

    # 3. Solicitudes de Registro con Contrato Notariado (Punto 16.4)
    requests = [
        RegistrationRequest(
            id="SOL-2026-081",
            applicant_name="Dra. Laura Batista",
            document_id="034-0029182-3",
            email="lbatista@claro.net.do",
            phone="(809) 555-0188",
            unit="101",
            role_requested="tenant",
            role_label="Inquilina Arrendataria",
            contract_filename="Contrato_Arrendamiento_U101_Notariado.pdf",
            contract_date="05 Oct 2026",
            status="pending",
            notes="Contrato de alquiler por 12 meses legalizado ante Notaría Pública de Mao. Depósito completado."
        ),
        RegistrationRequest(
            id="SOL-2026-079",
            applicant_name="Ing. Carlos Mendoza",
            document_id="001-1827364-5",
            email="cmendoza@gmail.com",
            phone="(809) 555-1284",
            unit="PH-901",
            role_requested="owner",
            role_label="Propietario Adquirente",
            contract_filename="Promesa_Compraventa_PH901_Inversionisto.pdf",
            contract_date="02 Oct 2026",
            status="pending",
            notes="Separación de US$5,000 acreditada vía PayPal. En trámite de aprobación final de inicial."
        )
    ]
    for r in requests:
        db.add(r)

    # 4. Pagos y Recibos Fiscales DGII
    payments = [
        Payment(id="PAG-2025-091", user_id="usr-301", unit="301", period="Octubre 2025", concept="Cuota de Mantenimiento Octubre", ncf="B0200000142", amount="RD$ 6,500.00", method="Tarjeta en Línea", status="Aprobado", date="01 Oct 2025"),
        Payment(id="PAG-2025-074", user_id="usr-301", unit="301", period="Septiembre 2025", concept="Cuota de Mantenimiento Septiembre", ncf="B0200000128", amount="RD$ 6,500.00", method="PayPal Online", status="Aprobado", date="01 Sep 2025"),
        Payment(id="PAG-2025-055", user_id="usr-301", unit="301", period="Agosto 2025", concept="Cuota de Mantenimiento Agosto", ncf="B0200000115", amount="RD$ 6,500.00", method="Transferencia Banco Popular", status="Aprobado", date="02 Ago 2025")
    ]
    for p in payments:
        db.add(p)

    # 5. Tickets de Mantenimiento
    tickets = [
        MaintenanceTicket(id="TCK-104", user_id="usr-301", unit="301", category="Plomería", subject="Revisión preventiva de grifo en cocina", priority="Media", status="En proceso", date="08 Oct 2025"),
        MaintenanceTicket(id="TCK-088", user_id="usr-301", unit="301", category="Electricidad", subject="Cambio de bombillo LED en balcón", priority="Baja", status="Completado", date="14 Sep 2025")
    ]
    for t in tickets:
        db.add(t)

    # 6. Actividades Recientes
    logs = [
        ActivityLog(title="Nueva solicitud de acceso: Dra. Laura Batista (Unidad 101)", time="Hace 10 min", activity_type="user"),
        ActivityLog(title="Separación de US$5,000 recibida vía PayPal para Penthouse PH-901", time="Hace 1 hora", activity_type="payment"),
        ActivityLog(title="Mantenimiento preventivo de planta eléctrica Cummins 150 kVA programado", time="Hace 3 horas", activity_type="maintenance")
    ]
    for l in logs:
        db.add(l)

    # 7. Visitas Agendadas
    visits = [
        Visit(id="VIS-201", visitor="Carlos Mendoza", phone="(809) 555-1284", email="cmendoza@gmail.com", unit="PH-901", date="30 Sep 2026", time="10:00 AM", mode="Presencial en Mao", notes="Interesado en opciones de financiamiento y compra de parqueos adicionales.", status="Confirmada", email_notified=True, email_notification_date="29 Sep 2026 04:15 PM"),
        Visit(id="VIS-202", visitor="Dra. Laura Batista", phone="(809) 555-8931", email="lbatista@claro.net.do", unit="Unidad 101", date="01 Oct 2026", time="03:30 PM", mode="Videollamada", notes="Coordinar videollamada para revisar contrato de alquiler y amenidades de la torre.", status="Confirmada", email_notified=True, email_notification_date="30 Sep 2026 11:20 AM"),
        Visit(id="VIS-203", visitor="Juan Carlos Ortiz", phone="(809) 555-9914", email="jcortiz@gmail.com", unit="Unidad 301", date="03 Oct 2026", time="11:00 AM", mode="Presencial en Mao", notes="Visita presencial con la familia para conocer el Rooftop, piscina y distribución del apartamento.", status="Pendiente", email_notified=True, email_notification_date="02 Oct 2026 09:30 AM")
    ]
    for v in visits:
        db.add(v)

    db.commit()
    logger.info("Base de datos inicializada exitosamente.")

