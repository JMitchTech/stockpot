from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from api.config import get_settings
from api.database import get_supabase_admin

settings = get_settings()
bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=["HS256"]
        )
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "restaurant_id": payload.get("restaurant_id")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

def require_pro(current_user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    restaurant = db.table("restaurants").select("plan").eq(
        "id", current_user["restaurant_id"]
    ).execute()
    if not restaurant.data or restaurant.data[0]["plan"] != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a Pro plan"
        )
    return current_user