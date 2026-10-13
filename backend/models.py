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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

