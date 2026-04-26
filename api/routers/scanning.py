from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from api.dependencies import get_current_user
from api.services.vision import extract_menu_from_image, extract_invoice_from_image

router = APIRouter(prefix="/scanning", tags=["scanning"])

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
MAX_SIZE_MB = 10


@router.post("/menu")
async def scan_menu(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a photo of a menu. Claude Vision extracts every dish,
    price, category, and description automatically.
    Returns structured data ready to populate the menu builder.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {ALLOWED_TYPES}"
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB}MB"
        )

    result = extract_menu_from_image(image_bytes, file.content_type)

    return {
        "items_found": len(result.get("items", [])),
        "items": result.get("items", []),
        "extraction_notes": result.get("extraction_notes", ""),
        "message": f"Nonna found {len(result.get('items', []))} dishes. Review and confirm to add them to your menu."
    }


@router.post("/invoice")
async def scan_invoice(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a supplier invoice photo. Claude Vision extracts all
    line items and costs, ready to update ingredient prices.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {ALLOWED_TYPES}"
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB}MB"
        )

    result = extract_invoice_from_image(image_bytes, file.content_type)

    return {
        "vendor_name": result.get("vendor_name", ""),
        "invoice_date": result.get("invoice_date", ""),
        "items_found": len(result.get("items", [])),
        "items": result.get("items", []),
        "invoice_total": result.get("invoice_total", 0.00),
        "extraction_notes": result.get("extraction_notes", ""),
        "message": f"Nonna found {len(result.get('items', []))} line items. Review and confirm to update your ingredient costs."
    }