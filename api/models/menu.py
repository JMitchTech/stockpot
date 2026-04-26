from pydantic import BaseModel
from typing import Optional, List

class RecipeLineIn(BaseModel):
    ingredient_id: str
    quantity: float
    unit: str

class MenuItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    sale_price: float
    recipe_lines: Optional[List[RecipeLineIn]] = []

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sale_price: Optional[float] = None
    active: Optional[bool] = None
    recipe_lines: Optional[List[RecipeLineIn]] = None

class MenuItemResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    category: Optional[str] = None
    sale_price: float
    food_cost_cached: Optional[float] = None
    margin_cached: Optional[float] = None
    active: bool
    allergens: Optional[List[str]] = []
    recipe_lines: Optional[List[dict]] = []