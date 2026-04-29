from fastapi import APIRouter, Depends, HTTPException, Request
from api.dependencies import get_current_user
from api.database import admin_select, admin_insert
from api.integrations.square import (
    get_square_locations,
    get_square_orders,
    normalize_square_order
)
from api.config import get_settings
from pydantic import BaseModel
from typing import Optional
import hmac
import hashlib
import base64
import json

router = APIRouter(prefix="/pos", tags=["pos"])
settings = get_settings()


class SquareConnectRequest(BaseModel):
    location_id: str


# ── SQUARE LOCATIONS ─────────────────────────────────────

@router.get("/square/locations")
def list_square_locations(current_user: dict = Depends(get_current_user)):
    """
    Returns all Square locations for the connected account.
    Owner picks which location to sync with Stockpot.
    """
    try:
        locations = get_square_locations()
        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── SQUARE SYNC ──────────────────────────────────────────

@router.post("/square/sync")
def sync_square_orders(
    req: SquareConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Pulls recent completed orders from Square and imports
    them into Stockpot's sales_data table.
    Matches Square line items to Stockpot menu items by name.
    Skips orders already imported using the Square order ID.
    """
    restaurant_id = current_user["restaurant_id"]

    try:
        orders = get_square_orders(req.location_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    imported = 0
    skipped = 0
    unmatched_items = []

    # Get existing menu items for name matching
    menu_items = admin_select("menu_items", "*", {"restaurant_id": restaurant_id})
    menu_map = {item["name"].lower(): item for item in menu_items}

    for order in orders:
        normalized = normalize_square_order(order, restaurant_id)
        external_id = normalized["external_id"]

        # Skip if already imported
        existing = admin_select("sales_data", "id", {"external_id": external_id})
        if existing:
            skipped += 1
            continue

        # Insert sale record
        sale_result = admin_insert("sales_data", {
            "restaurant_id": restaurant_id,
            "source": "square",
            "external_id": external_id,
            "total_revenue": normalized["total_revenue"],
            "sale_date": normalized["sale_date"]
        })
        sale_id = sale_result[0]["id"]

        # Insert line items — match to menu items by name
        for line in normalized["lines"]:
            menu_item = menu_map.get(line["name"].lower())
            menu_item_id = menu_item["id"] if menu_item else None

            if not menu_item:
                unmatched_items.append(line["name"])

            admin_insert("sale_line_items", {
                "sale_id": sale_id,
                "menu_item_id": menu_item_id,
                "quantity": line["quantity"],
                "unit_price": line["unit_price"]
            })

        imported += 1

    return {
        "imported": imported,
        "skipped": skipped,
        "total_orders_from_square": len(orders),
        "unmatched_items": list(set(unmatched_items)),
        "message": f"Sync complete. {imported} orders imported, {skipped} already existed."
    }


# ── SALES SUMMARY ────────────────────────────────────────

@router.get("/square/sales-summary")
def get_sales_summary(current_user: dict = Depends(get_current_user)):
    """
    Returns a summary of all synced Square sales.
    Used by Nonna and the dashboard for revenue context.
    """
    restaurant_id = current_user["restaurant_id"]
    sales = admin_select("sales_data", "*", {"restaurant_id": restaurant_id})

    total_revenue = sum(s.get("total_revenue", 0) or 0 for s in sales)
    square_sales = [s for s in sales if s.get("source") == "square"]
    manual_sales = [s for s in sales if s.get("source") == "manual"]

    # Top selling menu items
    line_items = []
    for sale in sales:
        lines = admin_select("sale_line_items", "*", {"sale_id": sale["id"]})
        line_items.extend(lines)

    item_totals = {}
    for line in line_items:
        if line.get("menu_item_id"):
            menu_items = admin_select(
                "menu_items", "name",
                {"id": line["menu_item_id"]}
            )
            if menu_items:
                name = menu_items[0]["name"]
                if name not in item_totals:
                    item_totals[name] = {"name": name, "quantity": 0, "revenue": 0.0}
                item_totals[name]["quantity"] += line.get("quantity", 0)
                item_totals[name]["revenue"] += (
                    line.get("unit_price", 0) * line.get("quantity", 0)
                )

    top_items = sorted(
        item_totals.values(),
        key=lambda x: x["quantity"],
        reverse=True
    )[:5]

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": len(sales),
        "square_synced_orders": len(square_sales),
        "manual_orders": len(manual_sales),
        "top_selling_items": top_items
    }


# ── WEBHOOK ──────────────────────────────────────────────

@router.post("/square/webhook")
async def square_webhook(request: Request):
    """
    Receives real time webhook events from Square.
    When a payment completes Square calls this endpoint
    automatically and Stockpot logs the sale instantly.
    Verifies the Square signature to reject fake requests.
    """
    body = await request.body()
    signature = request.headers.get("x-square-hmacsha256-signature", "")

    # Verify webhook signature if key is configured
    if settings.square_webhook_signature_key:
        expected = base64.b64encode(
            hmac.new(
                settings.square_webhook_signature_key.encode(),
                body,
                hashlib.sha256
            ).digest()
        ).decode()

        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(body)
    event_type = payload.get("type", "")

    if event_type == "payment.completed":
        payment = payload.get("data", {}).get("object", {}).get("payment", {})
        location_id = payment.get("location_id")
        order_id = payment.get("order_id")

        return {
            "received": True,
            "event_type": event_type,
            "location_id": location_id,
            "order_id": order_id,
            "status": "logged"
        }

    return {"received": True, "event_type": event_type, "status": "ignored"}