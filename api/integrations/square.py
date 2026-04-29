from square import Square
from square.environment import SquareEnvironment
from square.core.api_error import ApiError
from api.config import get_settings

settings = get_settings()


def get_square_client():
    environment = (
        SquareEnvironment.SANDBOX
        if settings.square_environment == "sandbox"
        else SquareEnvironment.PRODUCTION
    )
    return Square(
        token=settings.square_access_token,
        environment=environment
    )


def get_square_locations() -> list:
    client = get_square_client()
    try:
        response = client.locations.list()
        locations = []
        for loc in response.locations or []:
            try:
                addr = loc.address
                parts = [
                    addr.address_line_1,
                    addr.locality,
                    addr.administrative_district_level_1,
                    addr.postal_code
                ]
                address = ", ".join(p for p in parts if p)
            except Exception:
                address = ""
            locations.append({
                "id": loc.id,
                "name": loc.name,
                "status": str(loc.status) if loc.status else "",
                "address": address
            })
        return locations
    except ApiError as e:
        raise Exception(f"Square API error: {e.body}")


def get_square_orders(location_id: str, limit: int = 100) -> list:
    client = get_square_client()
    try:
        response = client.orders.search(
            location_ids=[location_id],
            limit=limit,
            query={
                "filter": {
                    "state_filter": {
                        "states": ["COMPLETED"]
                    }
                },
                "sort": {
                    "sort_field": "CLOSED_AT",
                    "sort_order": "DESC"
                }
            }
        )
        return response.orders or []
    except ApiError as e:
        raise Exception(f"Square API error: {e.body}")


def normalize_square_order(order, restaurant_id: str) -> dict:
    line_items = order.line_items or []
    total_money = order.total_money
    total_revenue = (total_money.amount or 0) / 100.0 if total_money else 0.0
    closed_at = order.closed_at or order.created_at or ""

    normalized_lines = []
    for line in line_items:
        name = line.name or ""
        quantity = int(line.quantity or "1")
        base_price = line.base_price_money
        unit_price = (base_price.amount or 0) / 100.0 if base_price else 0.0
        normalized_lines.append({
            "name": name,
            "quantity": quantity,
            "unit_price": unit_price
        })

    return {
        "restaurant_id": restaurant_id,
        "source": "square",
        "external_id": order.id,
        "total_revenue": total_revenue,
        "sale_date": closed_at,
        "lines": normalized_lines
    }