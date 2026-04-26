from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WasteLogCreate(BaseModel):
    ingredient_id: Optional[str] = None
    quantity: float
    unit: str
    reason: Optional[str] = None
    notes: Optional[str] = None

class WasteLogResponse(BaseModel):
    id: str
    restaurant_id: str
    ingredient_id: Optional[str] = None
    quantity: float
    unit: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    logged_at: str
    ingredient_name: Optional[str] = None
    cost_of_waste: Optional[float] = None