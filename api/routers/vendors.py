from fastapi import APIRouter, Depends, HTTPException
from api.models.vendors import (
    VendorCreate, VendorUpdate, VendorResponse,
    OrderCreate, OrderResponse, OrderLineResponse
)
from api.database import admin_select, admin_insert, admin_update
from api.dependencies import get_current_user
from typing import List
from datetime import datetime

router = APIRouter(prefix="/vendors", tags=["vendors"])


# ── Vendor CRUD ──────────────────────────────────────────

@router.get("/", response_model=List[VendorResponse])
def get_vendors(current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    return admin_select("vendors", "*", {"restaurant_id": restaurant_id})


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    vendors = admin_select("vendors", "*", {"id": vendor_id})
    if not vendors:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendors[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return vendors[0]


@router.post("/", response_model=VendorResponse)
def create_vendor(req: VendorCreate, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    vendors = admin_insert("vendors", {
        "restaurant_id": restaurant_id,
        "name": req.name,
        "rep_name": req.rep_name,
        "phone": req.phone,
        "email": req.email,
        "delivery_days": req.delivery_days,
        "payment_terms": req.payment_terms,
        "min_order": req.min_order
    })
    return vendors[0]


@router.patch("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    req: VendorUpdate,
    current_user: dict = Depends(get_current_user)
):
    restaurant_id = current_user["restaurant_id"]
    existing = admin_select("vendors", "*", {"id": vendor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if existing[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = req.model_dump(exclude_none=True)
    if update_data:
        admin_update("vendors", update_data, {"id": vendor_id})

    return admin_select("vendors", "*", {"id": vendor_id})[0]


# ── Orders ───────────────────────────────────────────────

@router.get("/{vendor_id}/orders", response_model=List[OrderResponse])
def get_vendor_orders(vendor_id: str, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    existing = admin_select("vendors", "*", {"id": vendor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if existing[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    orders = admin_select("vendor_orders", "*", {"vendor_id": vendor_id})

    result = []
    for order in orders:
        lines = admin_select("vendor_order_lines", "*", {"order_id": order["id"]})
        for line in lines:
            ingredients = admin_select("ingredients", "name", {"id": line["ingredient_id"]})
            line["ingredient_name"] = ingredients[0]["name"] if ingredients else None
        order["lines"] = lines
        order["vendor_name"] = existing[0]["name"]
        result.append(order)

    return result


@router.post("/orders", response_model=OrderResponse)
def create_order(req: OrderCreate, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    # Validate vendor
    vendors = admin_select("vendors", "*", {"id": req.vendor_id})
    if not vendors:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendors[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Calculate total
    total_cost = sum(line.quantity_ordered * line.unit_cost for line in req.lines)

    # Create order
    orders = admin_insert("vendor_orders", {
        "restaurant_id": restaurant_id,
        "vendor_id": req.vendor_id,
        "status": "draft",
        "total_cost": round(total_cost, 2),
        "ordered_at": datetime.utcnow().isoformat()
    })
    order = orders[0]
    order_id = order["id"]

    # Create order lines and update price history
    lines_out = []
    for line in req.lines:
        inserted = admin_insert("vendor_order_lines", {
            "order_id": order_id,
            "ingredient_id": line.ingredient_id,
            "quantity_ordered": line.quantity_ordered,
            "unit_cost": line.unit_cost
        })
        line_data = inserted[0]

        # Record price history
        admin_insert("price_history", {
            "ingredient_id": line.ingredient_id,
            "vendor_id": req.vendor_id,
            "unit_cost": line.unit_cost
        })

        # Update ingredient cost
        admin_update("ingredients", {
            "cost_per_unit": line.unit_cost
        }, {"id": line.ingredient_id})

        ingredients = admin_select("ingredients", "name", {"id": line.ingredient_id})
        line_data["ingredient_name"] = ingredients[0]["name"] if ingredients else None
        lines_out.append(line_data)

    order["lines"] = lines_out
    order["vendor_name"] = vendors[0]["name"]
    return order


@router.patch("/orders/{order_id}/deliver")
def mark_delivered(order_id: str, current_user: dict = Depends(get_current_user)):
    """Mark an order as delivered and update stock levels."""
    restaurant_id = current_user["restaurant_id"]

    orders = admin_select("vendor_orders", "*", {"id": order_id})
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
    if orders[0]["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update order status
    admin_update("vendor_orders", {
        "status": "delivered",
        "delivered_at": datetime.utcnow().isoformat()
    }, {"id": order_id})

    # Update stock levels from order lines
    lines = admin_select("vendor_order_lines", "*", {"order_id": order_id})
    for line in lines:
        ingredients = admin_select("ingredients", "current_stock", {"id": line["ingredient_id"]})
        if ingredients:
            current = ingredients[0]["current_stock"] or 0.0
            new_stock = current + line["quantity_ordered"]
            admin_update("ingredients", {
                "current_stock": new_stock
            }, {"id": line["ingredient_id"]})

    return {"message": "Order marked as delivered and stock levels updated"}


@router.get("/orders/history")
def get_order_history(current_user: dict = Depends(get_current_user)):
    """Full order history for this restaurant across all vendors."""
    restaurant_id = current_user["restaurant_id"]
    orders = admin_select("vendor_orders", "*", {"restaurant_id": restaurant_id})

    result = []
    for order in orders:
        vendors = admin_select("vendors", "name", {"id": order["vendor_id"]})
        order["vendor_name"] = vendors[0]["name"] if vendors else None
        lines = admin_select("vendor_order_lines", "*", {"order_id": order["id"]})
        for line in lines:
            ingredients = admin_select("ingredients", "name", {"id": line["ingredient_id"]})
            line["ingredient_name"] = ingredients[0]["name"] if ingredients else None
        order["lines"] = lines
        result.append(order)

    return result