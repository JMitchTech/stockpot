from api.database import admin_select

def calculate_food_cost(menu_item_id: str) -> dict:
    """
    Calculate food cost and margin for a menu item
    based on its recipe lines and ingredient costs.
    """
    # Get recipe lines for this menu item
    recipe_lines = admin_select(
        "recipe_lines",
        "quantity,unit,ingredient_id",
        {"menu_item_id": menu_item_id}
    )

    if not recipe_lines:
        return {"food_cost": 0.0, "margin": None}

    total_cost = 0.0

    for line in recipe_lines:
        # Get ingredient cost
        ingredients = admin_select(
            "ingredients",
            "cost_per_unit,unit",
            {"id": line["ingredient_id"]}
        )
        if ingredients:
            ingredient = ingredients[0]
            total_cost += ingredient["cost_per_unit"] * line["quantity"]

    return {"food_cost": round(total_cost, 4)}


def calculate_margin(sale_price: float, food_cost: float) -> dict:
    """
    Calculate margin percentage and margin dollar amount.
    Also returns a color indicator for the UI.
    """
    if sale_price <= 0:
        return {
            "margin_pct": None,
            "margin_dollars": None,
            "indicator": "gray"
        }

    food_cost_pct = (food_cost / sale_price) * 100
    margin_pct = 100 - food_cost_pct
    margin_dollars = sale_price - food_cost

    # Color indicator for UI — green/yellow/red
    if food_cost_pct <= 30:
        indicator = "green"
    elif food_cost_pct <= 38:
        indicator = "yellow"
    else:
        indicator = "red"

    return {
        "food_cost_pct": round(food_cost_pct, 2),
        "margin_pct": round(margin_pct, 2),
        "margin_dollars": round(margin_dollars, 2),
        "indicator": indicator
    }


def get_allergens_for_menu_item(menu_item_id: str) -> list:
    """
    Compile allergens for a menu item from all its ingredients.
    """
    recipe_lines = admin_select(
        "recipe_lines",
        "ingredient_id",
        {"menu_item_id": menu_item_id}
    )

    allergens = set()

    for line in recipe_lines:
        flags = admin_select(
            "allergen_flags",
            "allergen",
            {"ingredient_id": line["ingredient_id"]}
        )
        for flag in flags:
            allergens.add(flag["allergen"])

    return list(allergens)