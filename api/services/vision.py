import anthropic
import base64
from api.config import get_settings

settings = get_settings()


def encode_image(image_bytes: bytes) -> str:
    """Convert image bytes to base64 string."""
    return base64.standard_b64encode(image_bytes).decode("utf-8")


def extract_menu_from_image(image_bytes: bytes, media_type: str) -> dict:
    """
    Send a menu photo to Claude Vision and extract
    all dishes, prices, categories, and descriptions.
    Returns structured data ready to populate the menu builder.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    image_data = encode_image(image_bytes)

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": """You are analyzing a restaurant menu image. Extract every menu item you can see.

For each item return:
- name: the dish name
- category: the section it appears in (Appetizers, Entrees, Desserts, Drinks, etc.)
- price: the price as a number only (no $ sign)
- description: the full description if visible
- potential_ingredients: a list of ingredients you can infer from the name and description

Return ONLY a JSON object in this exact format, no other text:
{
  "items": [
    {
      "name": "dish name",
      "category": "category",
      "price": 12.99,
      "description": "description or empty string",
      "potential_ingredients": ["ingredient1", "ingredient2"]
    }
  ],
  "extraction_notes": "any notes about image quality or items that were unclear"
}

If the image is not a menu or is too blurry to read, return:
{
  "items": [],
  "extraction_notes": "explanation of why extraction failed"
}"""
                    }
                ]
            }
        ]
    )

    # Parse the response
    raw = response.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    import json
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "items": [],
            "extraction_notes": "Failed to parse menu extraction response."
        }

    return result


def extract_invoice_from_image(image_bytes: bytes, media_type: str) -> dict:
    """
    Send a supplier invoice photo to Claude Vision and extract
    line items, quantities, and unit costs.
    Returns structured data ready to update ingredient costs.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    image_data = encode_image(image_bytes)

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": """You are analyzing a supplier invoice or delivery receipt image.

Extract every line item you can see.

Return ONLY a JSON object in this exact format, no other text:
{
  "vendor_name": "supplier name if visible or empty string",
  "invoice_date": "date if visible or empty string",
  "items": [
    {
      "name": "ingredient or product name",
      "quantity": 10.0,
      "unit": "lb, kg, case, each, etc.",
      "unit_cost": 3.80,
      "total_cost": 38.00
    }
  ],
  "invoice_total": 0.00,
  "extraction_notes": "any notes about image quality or unclear items"
}

If the image is not an invoice or is too blurry, return:
{
  "vendor_name": "",
  "invoice_date": "",
  "items": [],
  "invoice_total": 0.00,
  "extraction_notes": "explanation of why extraction failed"
}"""
                    }
                ]
            }
        ]
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    import json
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "vendor_name": "",
            "invoice_date": "",
            "items": [],
            "invoice_total": 0.00,
            "extraction_notes": "Failed to parse invoice extraction response."
        }

    return result