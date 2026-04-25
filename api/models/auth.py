from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    restaurant_name: str
    preferred_language: str = "en"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    restaurant_id: str
    email: str
    role: str
    preferred_language: str

class UserOut(BaseModel):
    id: str
    email: str
    role: str
    restaurant_id: str
    preferred_language: str