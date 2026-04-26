from api.database import admin_select
from datetime import datetime, timedelta


def generate_purchase_forecast(restaurant_id: str) -> dict:
    """
    Generates a smart order list based on:
    - Current stock levels vs par levels
    - Recent waste patterns
    - Upcoming events

    Returns a list of ingredients to order with recommended quantities.
    """

    ingredients = admin_select("ingredients", "*", {"restaurant_id": restaurant_id})
    waste_logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})
    events = admin_select("events", "*", {"restaurant_id": restaurant_id})

    # Build waste map — average waste per ingredient
    waste_map = {}
    for log in waste_logs:
        ing_id = log.get("ingredient_id")
        if ing_id:
            if ing_id not in waste_map:
                waste_map[ing_id] = []
            waste_map[ing_id].append(log.get("quantity", 0.0))

    waste_averages = {
        ing_id: sum(quantities) / len(quantities)
        for ing_id, quantities in waste_map.items()
    }

    # Check for upcoming events in next 7 days
    today = datetime.utcnow().date()
    upcoming_events = []
    for event in events:
        try:
            raw_date = event["event_date"]
            # Handle both date string and datetime string formats
            if "T" in str(raw_date):
                event_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
            else:
                event_date = datetime.strptime(str(raw_date)[:10], "%Y-%m-%d").date()

            days_until = (event_date - today).days
            if 0 <= days_until <= 7:
                upcoming_events.append({
                    "name": event["name"],
                    "days_until": days_until
                })
        except Exception:
            pass

    # Generate order recommendations
    order_items = []
    for ing in ingredients:
        current_stock = ing.get("current_stock") or 0.0
        par_level = ing.get("par_level") or 0.0
        cost_per_unit = ing.get("cost_per_unit") or 0.0

        if par_level == 0:
            continue

        # Base quantity needed to reach par
        base_needed = par_level - current_stock

        # Add buffer for waste
        avg_waste = waste_averages.get(ing["id"], 0.0)
        waste_buffer = avg_waste * 1.5

        # Add buffer for upcoming events
        event_buffer = 0.0
        if upcoming_events:
            event_buffer = par_level * 0.20

        total_needed = base_needed + waste_buffer + event_buffer

        if total_needed > 0:
            order_items.append({
                "ingredient_id": ing["id"],
                "ingredient_name": ing["name"],
                "unit": ing["unit"],
                "current_stock": current_stock,
                "par_level": par_level,
                "recommended_order_quantity": round(total_needed, 2),
                "estimated_cost": round(total_needed * cost_per_unit, 2),
                "waste_buffer_included": round(waste_buffer, 2),
                "event_buffer_included": round(event_buffer, 2)
            })

    # Sort by estimated cost descending
    order_items.sort(key=lambda x: x["estimated_cost"], reverse=True)

    total_estimated_cost = round(sum(i["estimated_cost"] for i in order_items), 2)

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "upcoming_events": upcoming_events,
        "order_items": order_items,
        "total_estimated_cost": total_estimated_cost,
        "item_count": len(order_items)
    }