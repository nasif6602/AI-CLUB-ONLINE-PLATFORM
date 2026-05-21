import requests
from config import Config

SUPABASE_URL = Config.SUPABASE_URL.rstrip('/')
SERVICE_KEY = Config.SUPABASE_SERVICE_KEY

def supabase_request(method, path, payload=None):
    """Make an authenticated request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    response = requests.request(method, url, headers=headers, json=payload)
    if response.status_code >= 400:
        raise Exception(response.text)
    return response.json() if response.text else None