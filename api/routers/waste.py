from fastapi import APIRouter, Depends, HTTPException
from api.models.waste import WasteLogCreate, WasteLogResponse
from api.database import admin_select, admin_insert
from api.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/waste", tags=["waste"])


@router.get("/", response_model=List[WasteLogResponse])
def get_waste_logs(current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})

    result = []
    for log in logs:
        # Attach ingredient name and cost of waste
        if log.get("ingredient_id"):
            ingredients = admin_select(
                "ingredients", "name,cost_per_unit",
                {"id": log["ingredient_id"]}
            )
            if ingredients:
                ing = ingredients[0]
                log["ingredient_name"] = ing["name"]
                log["cost_of_waste"] = round(
                    ing["cost_per_unit"] * log["quantity"], 2
                )
            else:
                log["ingredient_name"] = None
                log["cost_of_waste"] = None
        else:
            log["ingredient_name"] = None
            log["cost_of_waste"] = None
        result.append(log)

    return result


@router.post("/", response_model=WasteLogResponse)
def log_waste(req: WasteLogCreate, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    # Validate ingredient belongs to this restaurant
    if req.ingredient_id:
        ingredients = admin_select(
            "ingredients", "*",
            {"id": req.ingredient_id}
        )
        if not ingredients:
            raise HTTPException(status_code=404, detail="Ingredient not found")
        if ingredients[0]["restaurant_id"] != restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")

    logs = admin_insert("waste_logs", {
        "restaurant_id": restaurant_id,
        "ingredient_id": req.ingredient_id,
        "quantity": req.quantity,
        "unit": req.unit,
        "reason": req.reason,
        "notes": req.notes
    })
    log = logs[0]

    # Attach ingredient name and cost
    if req.ingredient_id:
        ingredients = admin_select(
            "ingredients", "name,cost_per_unit",
            {"id": req.ingredient_id}
        )
        if ingredients:
            ing = ingredients[0]
            log["ingredient_name"] = ing["name"]
            log["cost_of_waste"] = round(
                ing["cost_per_unit"] * req.quantity, 2
            )
        else:
            log["ingredient_name"] = None
            log["cost_of_waste"] = None
    else:
        log["ingredient_name"] = None
        log["cost_of_waste"] = None

    return log


@router.get("/summary")
def get_waste_summary(current_user: dict = Depends(get_current_user)):
    """
    Returns total waste cost and top wasted ingredients.
    Used by Nonna and the dashboard.
    """
    restaurant_id = current_user["restaurant_id"]
    logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})

    total_cost = 0.0
    ingredient_totals = {}

    for log in logs:
        if log.get("ingredient_id"):
            ingredients = admin_select(
                "ingredients", "name,cost_per_unit",
                {"id": log["ingredient_id"]}
            )
            if ingredients:
                ing = ingredients[0]
                cost = ing["cost_per_unit"] * log["quantity"]
                total_cost += cost

                name = ing["name"]
                if name not in ingredient_totals:
                    ingredient_totals[name] = {
                        "ingredient_name": name,
                        "total_quantity": 0.0,
                        "total_cost": 0.0,
                        "unit": log["unit"]
                    }
                ingredient_totals[name]["total_quantity"] += log["quantity"]
                ingredient_totals[name]["total_cost"] += round(cost, 2)

    # Sort by cost descending
    top_wasted = sorted(
        ingredient_totals.values(),
        key=lambda x: x["total_cost"],
        reverse=True
    )[:5]

    return {
        "total_waste_cost": round(total_cost, 2),
        "top_wasted_ingredients": top_wasted
    }