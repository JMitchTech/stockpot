from fastapi import APIRouter, Depends, HTTPException
from api.models.inventory import (
    InventoryCountIn, BulkInventoryCountIn, InventoryCountResponse
)
from api.database import admin_select, admin_insert, admin_update
from api.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/count", response_model=List[InventoryCountResponse])
def submit_inventory_count(
    req: BulkInventoryCountIn,
    current_user: dict = Depends(get_current_user)
):
    restaurant_id = current_user["restaurant_id"]
    results = []

    for count in req.counts:
        # Validate ingredient belongs to this restaurant
        ingredients = admin_select("ingredients", "*", {"id": count.ingredient_id})
        if not ingredients:
            raise HTTPException(status_code=404, detail=f"Ingredient {count.ingredient_id} not found")
        if ingredients[0]["restaurant_id"] != restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")

        ingredient = ingredients[0]
        current_stock = ingredient.get("current_stock", 0.0) or 0.0
        cost_per_unit = ingredient.get("cost_per_unit", 0.0) or 0.0

        # Calculate variance before we update stock
        variance = round(count.quantity_counted - current_stock, 4)
        variance_cost = round(variance * cost_per_unit, 2)

        # Log the count — store stock level BEFORE we update it
        inserted = admin_insert("inventory_counts", {
            "restaurant_id": restaurant_id,
            "ingredient_id": count.ingredient_id,
            "quantity_counted": count.quantity_counted,
            "counted_by": count.counted_by,
            "stock_before_count": current_stock
        })
        record = inserted[0]

        # NOW update current stock to match the physical count
        admin_update("ingredients", {
            "current_stock": count.quantity_counted
        }, {"id": count.ingredient_id})

        record["ingredient_name"] = ingredient["name"]
        record["variance"] = variance
        record["variance_cost"] = variance_cost
        results.append(record)

    return results


@router.get("/history", response_model=List[InventoryCountResponse])
def get_inventory_history(current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    counts = admin_select("inventory_counts", "*", {"restaurant_id": restaurant_id})

    results = []
    for count in counts:
        ingredients = admin_select(
            "ingredients", "name,cost_per_unit,current_stock",
            {"id": count["ingredient_id"]}
        )
        if ingredients:
            ing = ingredients[0]
            count["ingredient_name"] = ing["name"]
            count["variance"] = None
            count["variance_cost"] = None
        results.append(count)

    return results


@router.get("/variance-report")
def get_variance_report(current_user: dict = Depends(get_current_user)):
    """
    Shows where physical counts don't match expected stock.
    Nonna uses this to flag shrinkage or recording errors.
    """
    restaurant_id = current_user["restaurant_id"]
    ingredients = admin_select("ingredients", "*", {"restaurant_id": restaurant_id})

    variances = []
    for ing in ingredients:
        counts = admin_select(
            "inventory_counts", "*",
            {"ingredient_id": ing["id"]}
        )
        if counts:
            # Get most recent count
            latest = sorted(counts, key=lambda x: x["counted_at"], reverse=True)[0]

            stock_before = latest.get("stock_before_count") or 0.0
            counted = latest.get("quantity_counted") or 0.0
            variance = round(counted - stock_before, 4)
            variance_cost = round(variance * (ing.get("cost_per_unit") or 0.0), 2)

            if abs(variance) > 0:
                variances.append({
                    "ingredient_name": ing["name"],
                    "expected_stock": stock_before,
                    "last_counted": counted,
                    "variance": variance,
                    "variance_cost": variance_cost,
                    "counted_at": latest["counted_at"],
                    "counted_by": latest.get("counted_by")
                })

    variances.sort(key=lambda x: abs(x["variance_cost"]), reverse=True)

    return {
        "total_variance_cost": round(sum(abs(v["variance_cost"]) for v in variances), 2),
        "variances": variances
    }