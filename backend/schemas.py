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

# AI Chat Request
class AIChatPrompt(BaseModel):
    prompt: str
    context_type: str = "public" # 'public', 'resident', 'admin'
    user_id: Optional[str] = None
    unit: Optional[str] = None
