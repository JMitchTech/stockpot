from fastapi import APIRouter, Depends, HTTPException
from api.models.ingredients import IngredientCreate, IngredientUpdate, IngredientResponse
from api.database import admin_select, admin_insert, admin_update
from api.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("/", response_model=List[IngredientResponse])
def get_ingredients(current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    ingredients = admin_select("ingredients", "*", {"restaurant_id": restaurant_id})
    
    # Attach allergens to each ingredient
    result = []
    for ing in ingredients:
        allergens = admin_select("allergen_flags", "allergen", {"ingredient_id": ing["id"]})
        ing["allergens"] = [a["allergen"] for a in allergens]
        result.append(ing)
    
    return result


@router.get("/{ingredient_id}", response_model=IngredientResponse)
def get_ingredient(ingredient_id: str, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    ingredients = admin_select("ingredients", "*", {"id": ingredient_id})
    
    if not ingredients:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    ingredient = ingredients[0]
    if ingredient["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    allergens = admin_select("allergen_flags", "allergen", {"ingredient_id": ingredient_id})
    ingredient["allergens"] = [a["allergen"] for a in allergens]
    
    return ingredient


@router.post("/", response_model=IngredientResponse)
def create_ingredient(req: IngredientCreate, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    # Create ingredient
    ingredients = admin_insert("ingredients", {
        "restaurant_id": restaurant_id,
        "name": req.name,
        "unit": req.unit,
        "cost_per_unit": req.cost_per_unit,
        "par_level": req.par_level,
        "current_stock": req.current_stock,
        "barcode": req.barcode
    })
    ingredient = ingredients[0]

    # Add allergen flags
    if req.allergens:
        for allergen in req.allergens:
            admin_insert("allergen_flags", {
                "ingredient_id": ingredient["id"],
                "allergen": allergen
            })

    ingredient["allergens"] = req.allergens or []
    return ingredient


@router.patch("/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(
    ingredient_id: str,
    req: IngredientUpdate,
    current_user: dict = Depends(get_current_user)
):
    restaurant_id = current_user["restaurant_id"]

    existing = admin_select("ingredients", "*", {"id": ingredient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    if existing[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = req.model_dump(exclude_none=True, exclude={"allergens"})
    if update_data:
        admin_update("ingredients", update_data, {"id": ingredient_id})

    updated = admin_select("ingredients", "*", {"id": ingredient_id})[0]
    allergens = admin_select("allergen_flags", "allergen", {"ingredient_id": ingredient_id})
    updated["allergens"] = [a["allergen"] for a in allergens]

    return updated


@router.get("/barcode/{barcode}", response_model=IngredientResponse)
def get_by_barcode(barcode: str, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    ingredients = admin_select("ingredients", "*", {"barcode": barcode})

    if not ingredients:
        raise HTTPException(status_code=404, detail="No ingredient found for this barcode")

    ingredient = ingredients[0]
    if ingredient["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    allergens = admin_select("allergen_flags", "allergen", {"ingredient_id": ingredient["id"]})
    ingredient["allergens"] = [a["allergen"] for a in allergens]

    return ingredient