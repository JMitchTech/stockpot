from fastapi import APIRouter, Depends, HTTPException
from api.dependencies import get_current_user
from api.database import admin_select, admin_insert
from api.services.forecasting import generate_purchase_forecast
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/purchasing", tags=["purchasing"])


class EventCreate(BaseModel):
    name: str
    type: Optional[str] = None
    event_date: str
    notes: Optional[str] = None


@router.get("/forecast")
def get_forecast(current_user: dict = Depends(get_current_user)):
    """
    Generate a smart purchase order list based on current
    stock, waste history, par levels, and upcoming events.
    This is Nonna's weekly order recommendation.
    """
    restaurant_id = current_user["restaurant_id"]
    forecast = generate_purchase_forecast(restaurant_id)
    return forecast


@router.get("/forecast/summary")
def get_forecast_summary(current_user: dict = Depends(get_current_user)):
    """
    Condensed version for the dashboard widget.
    Shows top 3 items to order and total estimated cost.
    """
    restaurant_id = current_user["restaurant_id"]
    forecast = generate_purchase_forecast(restaurant_id)

    return {
        "total_estimated_cost": forecast["total_estimated_cost"],
        "item_count": forecast["item_count"],
        "upcoming_events": forecast["upcoming_events"],
        "top_items": forecast["order_items"][:3]
    }


@router.post("/events")
def create_event(req: EventCreate, current_user: dict = Depends(get_current_user)):
    """
    Add a calendar event — holiday, local festival, private party.
    Nonna uses these to adjust purchasing recommendations.
    """
    restaurant_id = current_user["restaurant_id"]

    events = admin_insert("events", {
        "restaurant_id": restaurant_id,
        "name": req.name,
        "type": req.type,
        "event_date": req.event_date,
        "notes": req.notes
    })

    return events[0]


@router.get("/events")
def get_events(current_user: dict = Depends(get_current_user)):
    """
    Returns all calendar events for this restaurant.
    """
    restaurant_id = current_user["restaurant_id"]
    return admin_select("events", "*", {"restaurant_id": restaurant_id})