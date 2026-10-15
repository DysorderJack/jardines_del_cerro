from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Auth Schemas
class LoginRequest(BaseModel):
    document_id: str
    password: str = "1234"
    role: Optional[str] = None # 'owner', 'tenant', 'admin'

class UserResponse(BaseModel):
    id: str
    name: str
    document_id: str
    email: str
    phone: Optional[str] = None
    role: str
    role_label: str
    unit: Optional[str] = None
    aliquot: Optional[str] = "4.65%"
    status: str
    avatar: str
    avatar_url: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    official_title: Optional[str] = None
    notify_email: Optional[bool] = True
    notify_whatsapp: Optional[bool] = True
    subscription_exempt: Optional[bool] = False
    is_superadmin: Optional[bool] = False

# Unit Schemas
class UnitCreate(BaseModel):
    number: str
    unit_type: str = "apartment"
    sqm: int = 120
    bedrooms: int = 3
    bathrooms: int = 2
    level: int = 1
    status: str = "available"
    image: Optional[str] = None

class UnitUpdateStatus(BaseModel):
    status: str # 'available', 'reserved', 'occupied'

# Registration Request
class RegistrationDecision(BaseModel):
    action: str # 'approve', 'reject'
    notes: Optional[str] = None
    applicant_name: Optional[str] = None
    email: Optional[str] = None
    unit: Optional[str] = None
    role_label: Optional[str] = None

# Payment
class PaymentCreate(BaseModel):
    unit: str
    period: str
    concept: str
    amount: str = "RD$ 6,500.00"
    method: str = "PayPal Online"

# Maintenance
class TicketCreate(BaseModel):
    unit: str
    category: str = "General"
    subject: str
    priority: str = "Media"

# Assembly Vote
class VoteCreate(BaseModel):
    user_id: str
    unit: str
    point_id: str
    option: str # 'A favor', 'En contra', 'Abstención'
    aliquot: str = "4.65%"

# Subscription & PayPal
class PayPalVerifySubscription(BaseModel):
    context: str = "resident" # 'resident' o 'admin'
    user_id: Optional[str] = None
    plan_id: str
    plan_name: str
    period: str = "Mensual"
    price_usd: float
    paypal_sub_id: str
    order_id: Optional[str] = None
    payer_email: Optional[str] = None

class PayPalVerifyOrder(BaseModel):
    order_id: str
    plan_id: str = "admin-plan-monthly"
    plan_name: str = "Licencia SaaS Sistema Condominal Pro"
    period: str = "Mensual"
    price_usd: float = 24.99
    user_id: Optional[str] = None
    context: str = "admin"

# AI Chat Request
class AIChatPrompt(BaseModel):
    prompt: str
    context_type: str = "public" # 'public', 'resident', 'admin'
    user_id: Optional[str] = None
    unit: Optional[str] = None

# Admin Creation & Update Requests
class AdminCreate(BaseModel):
    name: str
    document_id: str
    email: str
    phone: Optional[str] = None
    password: str
    subscription_exempt: Optional[bool] = False

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None
    subscription_exempt: Optional[bool] = None

# Visit Schemas
class VisitCreate(BaseModel):
    visitor: str
    phone: str
    email: Optional[str] = None
    unit: str
    date: str
    time: str
    mode: Optional[str] = "Presencial en Mao"
    notes: Optional[str] = None

class VisitResponse(BaseModel):
    id: str
    visitor: str
    phone: str
    email: Optional[str] = None
    unit: str
    date: str
    time: str
    mode: str
    notes: Optional[str] = None
    status: str
    email_notified: bool = True
    email_notification_date: Optional[str] = None
    confirmed_at: Optional[str] = None
    reminder_sent_at: Optional[str] = None

class VisitUpdateStatus(BaseModel):
    status: str # 'Confirmada', 'Pendiente', 'Cancelada'

# Profile & Account Settings Schemas
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    official_title: Optional[str] = None
    notify_email: Optional[bool] = None
    notify_whatsapp: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


