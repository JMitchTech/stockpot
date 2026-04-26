from pydantic import BaseModel
from typing import Optional, List

class IngredientCreate(BaseModel):
    name: str
    unit: str
    cost_per_unit: float
    par_level: float = 0.0
    current_stock: float = 0.0
    barcode: Optional[str] = None
    allergens: Optional[List[str]] = []

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    cost_per_unit: Optional[float] = None
    par_level: Optional[float] = None
    current_stock: Optional[float] = None
    barcode: Optional[str] = None
    allergens: Optional[List[str]] = None

class IngredientResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    unit: str
    cost_per_unit: float
    par_level: float
    current_stock: float
    barcode: Optional[str] = None
    allergens: Optional[List[str]] = []