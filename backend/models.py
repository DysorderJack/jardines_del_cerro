import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    document_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(30), default="tenant")  # 'owner', 'tenant', 'admin'
    role_label = Column(String(60), default="Inquilino Arrendatario")
    unit = Column(String(20), nullable=True)     # e.g., '301', '501'
    aliquot = Column(String(20), default="0.00%") # e.g., '4.65%'
    password_hash = Column(String(128), default="1234")
    status = Column(String(20), default="pending") # 'pending', 'approved', 'rejected'
    avatar = Column(String(10), default="US")
    avatar_url = Column(Text, nullable=True)
    emergency_contact = Column(String(120), nullable=True)
    emergency_phone = Column(String(30), nullable=True)
    vehicle_plate = Column(String(30), nullable=True)
    vehicle_model = Column(String(80), nullable=True)
    official_title = Column(String(120), nullable=True)
    notify_email = Column(Boolean, default=True)
    notify_whatsapp = Column(Boolean, default=True)
    subscription_exempt = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Unit(Base):
    __tablename__ = "units"

    id = Column(String(50), primary_key=True, index=True)
    number = Column(String(20), unique=True, nullable=False)
    unit_type = Column(String(30), default="apartment") # 'apartment', 'penthouse'
    type_name = Column(String(50), default="Apartamento")
    sqm = Column(Integer, default=120)
    bedrooms = Column(Integer, default=3)
    bathrooms = Column(Integer, default=2)
    level = Column(Integer, default=1)
    status = Column(String(20), default="available") # 'available', 'reserved', 'occupied'
    status_label = Column(String(30), default="Disponible")
    modality = Column(String(30), default="purchase") # 'purchase', 'both'
    modality_label = Column(String(50), default="Solo Compra")
    price = Column(String(50), default="Desde US$ 145,000")
    features = Column(Text, nullable=True) # JSON o lista separada por comas
    image = Column(String(255), default="img/photo-1564078516393-cf04bd966897_w800_h600.jpg")

class RegistrationRequest(Base):
    __tablename__ = "registration_requests"

    id = Column(String(50), primary_key=True, index=True)
    applicant_name = Column(String(120), nullable=False)
    document_id = Column(String(30), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    unit = Column(String(20), nullable=False)
    role_requested = Column(String(30), default="owner") # 'owner', 'tenant'
    role_label = Column(String(60), default="Propietario Adquirente")
    contract_filename = Column(String(255), nullable=True)
    contract_date = Column(String(50), nullable=True)
    status = Column(String(20), default="pending") # 'pending', 'approved', 'rejected'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), nullable=True)
    unit = Column(String(20), nullable=False)
    period = Column(String(50), nullable=False)
    concept = Column(String(150), nullable=False)
    ncf = Column(String(30), nullable=False) # e.g. B0200000142
    amount = Column(String(50), default="RD$ 6,500.00")
    method = Column(String(60), default="PayPal Online")
    status = Column(String(30), default="Aprobado")
    date = Column(String(50), default="Hoy")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), nullable=True)
    unit = Column(String(20), nullable=False)
    category = Column(String(50), default="General")
    subject = Column(Text, nullable=False)
    priority = Column(String(30), default="Media") # 'Baja', 'Media', 'Alta'
    status = Column(String(30), default="En proceso") # 'En proceso', 'Completado'
    date = Column(String(50), default="Hoy")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AssemblyVote(Base):
    __tablename__ = "assembly_votes"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)
    point_id = Column(String(50), nullable=False)
    option = Column(String(50), nullable=False) # 'A favor', 'En contra', 'Abstención'
    aliquot = Column(String(20), default="4.65%")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(50), primary_key=True, index=True)
    context = Column(String(30), default="resident") # 'resident', 'admin'
    user_id = Column(String(50), nullable=True)
    plan_id = Column(String(50), nullable=False)
    plan_name = Column(String(100), nullable=False)
    period = Column(String(30), default="Mensual") # 'Mensual', 'Anual'
    price_usd = Column(Float, default=9.99)
    paypal_sub_id = Column(String(100), unique=True, nullable=True)
    status = Column(String(30), default="active") # 'active', 'cancelled'
    renewal_date = Column(String(50), nullable=True)
    encf = Column(String(20), nullable=True) # e.g. E310000000001
    security_code = Column(String(20), nullable=True) # e.g. A8B2C9
    qr_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    time = Column(String(50), default="Hace un momento")
    activity_type = Column(String(30), default="system")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Visit(Base):
    __tablename__ = "visits"

    id = Column(String(50), primary_key=True, index=True)
    visitor = Column(String(120), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(120), nullable=True)
    unit = Column(String(50), nullable=False)
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    mode = Column(String(50), default="Presencial en Mao")
    notes = Column(Text, nullable=True)
    status = Column(String(30), default="Pendiente")
    email_notified = Column(Boolean, default=True)
    email_notification_date = Column(String(50), nullable=True)
    confirmed_at = Column(String(50), nullable=True)
    reminder_sent_at = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ElectronicInvoice(Base):
    """
    Comprobante Fiscal Electrónico (e-CF) bajo la Ley 32-23 de la República Dominicana (DGII).
    Gestiona Facturas con Crédito Fiscal (E31) para suscripciones SaaS de la administración
    y Facturas de Consumo (E32) para recibos de mantenimiento.
    """
    __tablename__ = "electronic_invoices"

    id = Column(String(60), primary_key=True, index=True)
    encf = Column(String(25), unique=True, index=True, nullable=False)  # ej. E310000000001
    type_id = Column(String(10), default="31")  # "31" (Crédito Fiscal), "32" (Consumo)
    type_name = Column(String(100), default="Factura de Crédito Fiscal Electrónica")
    context = Column(String(40), default="admin_subscription")  # 'admin_subscription', 'resident_maintenance'
    user_id = Column(String(120), nullable=True)  # email del administrador o residente
    paypal_reference = Column(String(120), nullable=True)  # ID de orden o suscripción PayPal
    rnc_emisor = Column(String(30), default="132-45678-9")
    razon_social_emisor = Column(String(180), default="Torre Residencial Jardines del Cerro IV, S.R.L.")
    rnc_receptor = Column(String(30), nullable=False)
    razon_social_receptor = Column(String(180), nullable=False)
    concept = Column(String(255), default="Licencia SaaS Sistema Condominal Torre Jardines del Cerro IV")
    currency = Column(String(10), default="DOP")
    exchange_rate = Column(Float, default=60.50)
    amount_usd = Column(Float, default=24.99)
    subtotal_dop = Column(Float, nullable=False)
    itbis_dop = Column(Float, nullable=False)
    total_dop = Column(Float, nullable=False)
    security_code = Column(String(20), nullable=False)  # 6 caracteres alfanuméricos DGII
    qr_url = Column(Text, nullable=False)  # URL timbrado oficial DGII
    status = Column(String(60), default="Aceptado por DGII (Ley 32-23)")
    dgii_track_id = Column(String(100), nullable=True)
    legal_framework = Column(String(150), default="Ley 32-23 de Facturación Electrónica de la República Dominicana")
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

