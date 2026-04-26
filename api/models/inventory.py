from pydantic import BaseModel
from typing import Optional, List

class InventoryCountIn(BaseModel):
    ingredient_id: str
    quantity_counted: float
    counted_by: Optional[str] = None

class BulkInventoryCountIn(BaseModel):
    counts: List[InventoryCountIn]

class InventoryCountResponse(BaseModel):
    id: str
    restaurant_id: str
    ingredient_id: str
    ingredient_name: Optional[str] = None
    quantity_counted: float
    counted_by: Optional[str] = None
    counted_at: str
    variance: Optional[float] = None
    variance_cost: Optional[float] = None