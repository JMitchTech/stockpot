from fastapi import APIRouter, Depends, HTTPException
from api.models.nonna import NonnaChatRequest, NonnaOnboardingRequest
from api.dependencies import get_current_user
from api.database import admin_select
from nonna.context_builder import build_nonna_context
from nonna.prompts import get_system_prompt, get_onboarding_prompt
from api.config import get_settings
import anthropic

router = APIRouter(prefix="/nonna", tags=["nonna"])
settings = get_settings()


def get_language(restaurant_id: str) -> str:
    restaurants = admin_select("restaurants", "preferred_language", {"id": restaurant_id})
    if restaurants:
        return restaurants[0].get("preferred_language", "en")
    return "en"


@router.post("/chat")
def nonna_chat(req: NonnaChatRequest, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]

    # Build context from live data
    context = build_nonna_context(restaurant_id)
    language = get_language(restaurant_id)
    system_prompt = get_system_prompt(context, language)

    # Build message history
    messages = []
    for msg in req.history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    messages.append({
        "role": "user",
        "content": req.message
    })

    # Call Anthropic API
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        system=system_prompt,
        messages=messages
    )

    nonna_reply = response.content[0].text

    return {
        "reply": nonna_reply,
        "context_snapshot": {
            "total_waste_cost": context["waste"]["total_waste_cost"],
            "low_stock_count": len(context["inventory"]["low_stock_items"]),
            "red_margin_count": len(context["menu"]["red_margin_items"])
        }
    }


@router.post("/onboarding")
def nonna_onboarding(req: NonnaOnboardingRequest, current_user: dict = Depends(get_current_user)):
    restaurant_id = current_user["restaurant_id"]
    language = get_language(restaurant_id)
    system_prompt = get_onboarding_prompt(language)

    messages = []
    for msg in req.history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    messages.append({
        "role": "user",
        "content": req.message
    })

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        system=system_prompt,
        messages=messages
    )

    return {"reply": response.content[0].text}


@router.get("/alerts")
def get_nonna_alerts(current_user: dict = Depends(get_current_user)):
    """
    Returns proactive alerts Nonna should surface to the owner.
    Called on dashboard load.
    """
    restaurant_id = current_user["restaurant_id"]
    context = build_nonna_context(restaurant_id)

    alerts = []

    # Low stock alerts
    for item in context["inventory"]["low_stock_items"]:
        alerts.append({
            "type": "low_stock",
            "severity": "warning",
            "message": f"{item['name']} is below par level — you have {item['current_stock']} units but your par is {item['par_level']}"
        })

    # Red margin alerts
    for item in context["menu"]["red_margin_items"]:
        alerts.append({
            "type": "margin",
            "severity": "danger",
            "message": f"{item['name']} has a margin of {item['margin']}% — below your target. Nonna recommends reviewing the recipe cost."
        })

    # Waste alerts
    if context["waste"]["total_waste_cost"] > 50:
        alerts.append({
            "type": "waste",
            "severity": "warning",
            "message": f"Total waste cost is ${context['waste']['total_waste_cost']}. Your top wasted item is {context['waste']['top_wasted'][0]['name'] if context['waste']['top_wasted'] else 'unknown'}."
        })

    return {
        "alert_count": len(alerts),
        "alerts": alerts
    }