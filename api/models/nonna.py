from pydantic import BaseModel
from typing import Optional, List

class NonnaChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class NonnaChatRequest(BaseModel):
    message: str
    history: Optional[List[NonnaChatMessage]] = []

class NonnaOnboardingRequest(BaseModel):
    message: str
    history: Optional[List[NonnaChatMessage]] = []