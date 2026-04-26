from api.database import admin_select


def build_nonna_context(restaurant_id: str) -> dict:
    """
    Assembles a snapshot of the restaurant's live data
    to feed into every Nonna API call as context.
    """

    # Restaurant info
    restaurants = admin_select("restaurants", "*", {"id": restaurant_id})
    restaurant = restaurants[0] if restaurants else {}

    # Menu items
    menu_items = admin_select("menu_items", "*", {"restaurant_id": restaurant_id})

    # Ingredients
    ingredients = admin_select("ingredients", "*", {"restaurant_id": restaurant_id})

    # Waste summary
    waste_logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})
    total_waste_cost = 0.0
    ingredient_waste = {}

    for log in waste_logs:
        if log.get("ingredient_id"):
            ing_list = admin_select(
                "ingredients", "name,cost_per_unit",
                {"id": log["ingredient_id"]}
            )
            if ing_list:
                ing = ing_list[0]
                cost = ing["cost_per_unit"] * log["quantity"]
                total_waste_cost += cost
                name = ing["name"]
                if name not in ingredient_waste:
                    ingredient_waste[name] = 0.0
                ingredient_waste[name] += cost

    top_wasted = sorted(
        [{"name": k, "cost": round(v, 2)} for k, v in ingredient_waste.items()],
        key=lambda x: x["cost"],
        reverse=True
    )[:3]

    # Menu health
    green_items = [m for m in menu_items if m.get("margin_cached", 0) and m["margin_cached"] >= 70]
    yellow_items = [m for m in menu_items if m.get("margin_cached", 0) and 50 <= m["margin_cached"] < 70]
    red_items = [m for m in menu_items if m.get("margin_cached", 0) and m["margin_cached"] < 50]

    # Low stock alerts
    low_stock = [
        i for i in ingredients
        if i.get("current_stock", 0) <= i.get("par_level", 0)
        and i.get("par_level", 0) > 0
    ]

    return {
        "restaurant": {
            "name": restaurant.get("name"),
            "plan": restaurant.get("plan"),
            "food_cost_target_pct": restaurant.get("food_cost_target_pct", 30.0),
            "preferred_language": restaurant.get("preferred_language", "en")
        },
        "menu": {
            "total_items": len(menu_items),
            "green_margin_items": [{"name": m["name"], "margin": m["margin_cached"]} for m in green_items],
            "yellow_margin_items": [{"name": m["name"], "margin": m["margin_cached"]} for m in yellow_items],
            "red_margin_items": [{"name": m["name"], "margin": m["margin_cached"]} for m in red_items],
        },
        "waste": {
            "total_waste_cost": round(total_waste_cost, 2),
            "top_wasted": top_wasted
        },
        "inventory": {
            "low_stock_items": [
                {"name": i["name"], "current_stock": i["current_stock"], "par_level": i["par_level"]}
                for i in low_stock
            ]
        }
    }