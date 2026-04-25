from supabase import create_client, Client
from api.config import get_settings
import httpx

settings = get_settings()

def get_supabase() -> Client:
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key
    )

def get_admin_headers() -> dict:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def admin_select(table: str, query: str = "*", filters: dict = None):
    url = f"{settings.supabase_url}/rest/v1/{table}?select={query}"
    if filters:
        for key, value in filters.items():
            url += f"&{key}=eq.{value}"
    response = httpx.get(url, headers=get_admin_headers())
    response.raise_for_status()
    return response.json()

def admin_insert(table: str, data: dict):
    url = f"{settings.supabase_url}/rest/v1/{table}"
    response = httpx.post(url, headers=get_admin_headers(), json=data)
    response.raise_for_status()
    return response.json()

def admin_update(table: str, data: dict, filters: dict):
    url = f"{settings.supabase_url}/rest/v1/{table}?"
    for key, value in filters.items():
        url += f"{key}=eq.{value}&"
    url = url.rstrip("&")
    response = httpx.patch(url, headers=get_admin_headers(), json=data)
    response.raise_for_status()
    return response.json()