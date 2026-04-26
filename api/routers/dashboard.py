from fastapi import APIRouter, Depends
from api.dependencies import get_current_user
from api.database import admin_select
from api.services.food_cost import calculate_food_cost, calculate_margin
from api.services.forecasting import generate_purchase_forecast
from datetime import datetime

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def compute_health_score(
    food_cost_pct: float,
    target_pct: float,
    waste_cost: float,
    low_stock_count: int,
    red_margin_count: int
) -> dict:
    """
    Computes a single health score from 0-100.
    Green: 75-100, Yellow: 50-74, Red: 0-49
    This is the big number on the owner's dashboard every morning.
    """
    score = 100

    # Food cost vs target — biggest factor
    if food_cost_pct > 0 and target_pct > 0:
        overage_pct = ((food_cost_pct - target_pct) / target_pct) * 100
        if overage_pct > 0:
            score -= min(overage_pct * 1.5, 40)

    # Waste penalty
    if waste_cost > 100:
        score -= 15
    elif waste_cost > 50:
        score -= 8
    elif waste_cost > 20:
        score -= 4

    # Low stock penalty
    score -= low_stock_count * 3

    # Red margin dishes penalty
    score -= red_margin_count * 5

    score = max(0, min(100, round(score)))

    if score >= 75:
        indicator = "green"
    elif score >= 50:
        indicator = "yellow"
    else:
        indicator = "red"

    return {"score": score, "indicator": indicator}


@router.get("/")
def get_dashboard(current_user: dict = Depends(get_current_user)):
    """
    The single endpoint that powers the main dashboard screen.
    Called every time the owner opens the app.
    Pulls from every data source and returns a complete snapshot.
    """
    restaurant_id = current_user["restaurant_id"]

    # Restaurant info
    restaurants = admin_select("restaurants", "*", {"id": restaurant_id})
    restaurant = restaurants[0] if restaurants else {}
    target_pct = restaurant.get("food_cost_target_pct", 30.0)

    # Menu stats
    menu_items = admin_select("menu_items", "*", {"restaurant_id": restaurant_id})
    active_items = [m for m in menu_items if m.get("active")]

    green_items = []
    yellow_items = []
    red_items = []

    for item in active_items:
        margin = item.get("margin_cached")
        if margin is None:
            continue
        if margin >= 70:
            green_items.append({"name": item["name"], "margin": margin, "sale_price": item["sale_price"]})
        elif margin >= 50:
            yellow_items.append({"name": item["name"], "margin": margin, "sale_price": item["sale_price"]})
        else:
            red_items.append({"name": item["name"], "margin": margin, "sale_price": item["sale_price"]})

    # Food cost across all active menu items
    total_food_cost = 0.0
    total_revenue = 0.0
    for item in active_items:
        food_cost = item.get("food_cost_cached") or 0.0
        sale_price = item.get("sale_price") or 0.0
        total_food_cost += food_cost
        total_revenue += sale_price

    overall_food_cost_pct = round(
        (total_food_cost / total_revenue * 100) if total_revenue > 0 else 0.0, 2
    )

    # Waste summary
    waste_logs = admin_select("waste_logs", "*", {"restaurant_id": restaurant_id})
    total_waste_cost = 0.0
    waste_by_ingredient = {}

    for log in waste_logs:
        if log.get("ingredient_id"):
            ings = admin_select("ingredients", "name,cost_per_unit", {"id": log["ingredient_id"]})
            if ings:
                cost = ings[0]["cost_per_unit"] * log["quantity"]
                total_waste_cost += cost
                name = ings[0]["name"]
                waste_by_ingredient[name] = waste_by_ingredient.get(name, 0.0) + cost

    top_wasted = sorted(
        [{"name": k, "cost": round(v, 2)} for k, v in waste_by_ingredient.items()],
        key=lambda x: x["cost"],
        reverse=True
    )[:3]

    # Inventory — low stock
    ingredients = admin_select("ingredients", "*", {"restaurant_id": restaurant_id})
    low_stock = [
        {
            "name": i["name"],
            "current_stock": i["current_stock"],
            "par_level": i["par_level"],
            "unit": i["unit"]
        }
        for i in ingredients
        if (i.get("current_stock") or 0) <= (i.get("par_level") or 0)
        and (i.get("par_level") or 0) > 0
    ]

    # Purchasing forecast summary
    forecast = generate_purchase_forecast(restaurant_id)

    # Health score
    health = compute_health_score(
        food_cost_pct=overall_food_cost_pct,
        target_pct=target_pct,
        waste_cost=total_waste_cost,
        low_stock_count=len(low_stock),
        red_margin_count=len(red_items)
    )

    # Nonna alerts
    alerts = []

    if low_stock:
        for item in low_stock:
            alerts.append({
                "type": "low_stock",
                "severity": "warning",
                "message": f"{item['name']} is below par — {item['current_stock']} {item['unit']} on hand, par is {item['par_level']}"
            })

    if red_items:
        for item in red_items:
            alerts.append({
                "type": "margin",
                "severity": "danger",
                "message": f"{item['name']} has a {item['margin']}% margin — below target. Review recipe cost."
            })

    if total_waste_cost > 50:
        alerts.append({
            "type": "waste",
            "severity": "warning",
            "message": f"Total waste cost is ${round(total_waste_cost, 2)}. Top wasted item: {top_wasted[0]['name'] if top_wasted else 'unknown'}."
        })

    if overall_food_cost_pct > target_pct:
        alerts.append({
            "type": "food_cost",
            "severity": "danger",
            "message": f"Overall food cost is {overall_food_cost_pct}% — above your {target_pct}% target."
        })

    if forecast["upcoming_events"]:
        for event in forecast["upcoming_events"]:
            alerts.append({
                "type": "event",
                "severity": "info",
                "message": f"{event['name']} is in {event['days_until']} days — your purchasing forecast has been adjusted."
            })

    return {
        "restaurant_name": restaurant.get("name"),
        "generated_at": datetime.utcnow().isoformat(),
        "health_score": health,
        "food_cost": {
            "overall_pct": overall_food_cost_pct,
            "target_pct": target_pct,
            "status": "over" if overall_food_cost_pct > target_pct else "on_target"
        },
        "menu": {
            "total_active_items": len(active_items),
            "green_items": green_items,
            "yellow_items": yellow_items,
            "red_items": red_items
        },
        "waste": {
            "total_cost": round(total_waste_cost, 2),
            "top_wasted": top_wasted
        },
        "inventory": {
            "low_stock_count": len(low_stock),
            "low_stock_items": low_stock
        },
        "purchasing": {
            "total_estimated_cost": forecast["total_estimated_cost"],
            "item_count": forecast["item_count"],
            "upcoming_events": forecast["upcoming_events"],
            "top_items": forecast["order_items"][:3]
        },
        "alerts": {
            "count": len(alerts),
            "items": alerts
        }
    }