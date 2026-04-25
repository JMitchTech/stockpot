from fastapi import APIRouter, HTTPException
from jose import jwt
from datetime import datetime, timedelta
import bcrypt
from api.models.auth import RegisterRequest, LoginRequest, TokenResponse
from api.database import admin_select, admin_insert, admin_update
from api.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 720  # 12 hours


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8")
    )


def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    # Check if email already exists
    existing = admin_select("users", "id", {"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create restaurant
    restaurants = admin_insert("restaurants", {
        "name": req.restaurant_name,
        "preferred_language": req.preferred_language,
        "plan": "free"
    })
    restaurant_id = restaurants[0]["id"]

    # Create user
    users = admin_insert("users", {
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "restaurant_id": restaurant_id,
        "role": "owner",
        "preferred_language": req.preferred_language
    })
    user_data = users[0]

    token = create_token({
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "restaurant_id": restaurant_id
    })

    return TokenResponse(
        access_token=token,
        restaurant_id=restaurant_id,
        email=user_data["email"],
        role=user_data["role"],
        preferred_language=user_data["preferred_language"]
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    # Find user
    result = admin_select("users", "*", {"email": req.email})
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result[0]

    # Verify password
    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update last login
    admin_update("users", {
        "last_login": datetime.utcnow().isoformat()
    }, {"id": user["id"]})

    token = create_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "restaurant_id": user["restaurant_id"]
    })

    return TokenResponse(
        access_token=token,
        restaurant_id=user["restaurant_id"],
        email=user["email"],
        role=user["role"],
        preferred_language=user["preferred_language"]
    )


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}