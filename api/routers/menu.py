from fastapi import APIRouter, Depends, HTTPException
from api.models.menu import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from api.database import admin_select, admin_insert, admin_update
from api.dependencies import get_current_user
from api.services.food_cost import calculate_food_cost, calculate_margin, get_allergens_for_menu_item
from typing import List

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("/", response_model=List[MenuItemResponse])
def get_menu(current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    items = admin_select("menu_items", "*", {"restaurant_id": restaurant_id})

    result = []
    for item in items:
        recipe_lines = admin_select("recipe_lines", "*", {"menu_item_id": item["id"]})
        allergens = get_allergens_for_menu_item(item["id"])
        item["recipe_lines"] = recipe_lines
        item["allergens"] = allergens
        result.append(item)

    return result


@router.get("/{item_id}", response_model=MenuItemResponse)
def get_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    items = admin_select("menu_items", "*", {"id": item_id})

    if not items:
        raise HTTPException(status_code=404, detail="Menu item not found")

    item = items[0]
    if item["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    recipe_lines = admin_select("recipe_lines", "*", {"menu_item_id": item_id})
    allergens = get_allergens_for_menu_item(item_id)
    item["recipe_lines"] = recipe_lines
    item["allergens"] = allergens

    return item


@router.post("/", response_model=MenuItemResponse)
def create_menu_item(req: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    # Create menu item
    items = admin_insert("menu_items", {
        "restaurant_id": restaurant_id,
        "name": req.name,
        "category": req.category,
        "sale_price": req.sale_price,
        "active": True
    })
    item = items[0]
    item_id = item["id"]

    # Add recipe lines
    if req.recipe_lines:
        for line in req.recipe_lines:
            admin_insert("recipe_lines", {
                "menu_item_id": item_id,
                "ingredient_id": line.ingredient_id,
                "quantity": line.quantity,
                "unit": line.unit
            })

    # Calculate and cache food cost
    food_cost_data = calculate_food_cost(item_id)
    food_cost = food_cost_data["food_cost"]
    margin_data = calculate_margin(req.sale_price, food_cost)

    # Update cached values
    admin_update("menu_items", {
        "food_cost_cached": food_cost,
        "margin_cached": margin_data.get("margin_pct")
    }, {"id": item_id})

    # Compile allergens from recipe
    allergens = get_allergens_for_menu_item(item_id)

    # Write allergens to menu_item_allergens
    for allergen in allergens:
        admin_insert("menu_item_allergens", {
            "menu_item_id": item_id,
            "allergen": allergen
        })

    item["food_cost_cached"] = food_cost
    item["margin_cached"] = margin_data.get("margin_pct")
    item["recipe_lines"] = [line.model_dump() for line in req.recipe_lines]
    item["allergens"] = allergens

    return item


@router.patch("/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: str,
    req: MenuItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    restaurant_id = current_user["restaurant_id"]

    existing = admin_select("menu_items", "*", {"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if existing[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = req.model_dump(exclude_none=True, exclude={"recipe_lines"})
    if update_data:
        admin_update("menu_items", update_data, {"id": item_id})

    # Recalculate food cost if recipe changed
    if req.recipe_lines is not None:
        food_cost_data = calculate_food_cost(item_id)
        food_cost = food_cost_data["food_cost"]
        sale_price = req.sale_price or existing[0]["sale_price"]
        margin_data = calculate_margin(sale_price, food_cost)

        admin_update("menu_items", {
            "food_cost_cached": food_cost,
            "margin_cached": margin_data.get("margin_pct")
        }, {"id": item_id})

    updated = admin_select("menu_items", "*", {"id": item_id})[0]
    recipe_lines = admin_select("recipe_lines", "*", {"menu_item_id": item_id})
    allergens = get_allergens_for_menu_item(item_id)
    updated["recipe_lines"] = recipe_lines
    updated["allergens"] = allergens

    return updated


@router.delete("/{item_id}")
def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    existing = admin_select("menu_items", "*", {"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if existing[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    admin_update("menu_items", {"active": False}, {"id": item_id})
    return {"message": "Menu item deactivated"}


@router.get("/{item_id}/cost")
def get_food_cost(item_id: str, current_user: dict = Depends(get_current_user)):
    existing = admin_select("menu_items", "*", {"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Menu item not found")
    if existing[0]["restaurant_id"] != current_user["restaurant_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    food_cost_data = calculate_food_cost(item_id)
    food_cost = food_cost_data["food_cost"]
    sale_price = existing[0]["sale_price"]
    margin_data = calculate_margin(sale_price, food_cost)

    return {
        "menu_item_id": item_id,
        "name": existing[0]["name"],
        "sale_price": sale_price,
        "food_cost": food_cost,
        **margin_data
    }