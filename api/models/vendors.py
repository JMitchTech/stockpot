from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VendorCreate(BaseModel):
    name: str
    rep_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    delivery_days: Optional[str] = None
    payment_terms: Optional[str] = None
    min_order: Optional[float] = None

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    rep_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    delivery_days: Optional[str] = None
    payment_terms: Optional[str] = None
    min_order: Optional[float] = None

class VendorResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    rep_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    delivery_days: Optional[str] = None
    payment_terms: Optional[str] = None
    min_order: Optional[float] = None

class OrderLineIn(BaseModel):
    ingredient_id: str
    quantity_ordered: float
    unit_cost: float

class OrderCreate(BaseModel):
    vendor_id: str
    lines: List[OrderLineIn]

class OrderLineResponse(BaseModel):
    id: str
    order_id: str
    ingredient_id: str
    quantity_ordered: float
    unit_cost: float
    quantity_received: Optional[float] = None
    ingredient_name: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    restaurant_id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    status: str
    total_cost: Optional[float] = None
    ordered_at: Optional[str] = None
    delivered_at: Optional[str] = None
    lines: Optional[List[OrderLineResponse]] = []