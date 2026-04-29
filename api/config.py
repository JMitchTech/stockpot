from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Anthropic
    anthropic_api_key: str

    # Square
    square_access_token: str = ""
    square_application_id: str = ""
    square_environment: str = "sandbox"
    square_webhook_signature_key: str = ""

    # App
    app_env: str = "development"
    secret_key: str
    port: int = 8000

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()