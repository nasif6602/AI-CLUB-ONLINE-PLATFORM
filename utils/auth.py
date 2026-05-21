import requests
import jwt
from jwt import PyJWKClient
from config import Config
from utils.supabase_client import supabase_request

# Cache the JWK client so it doesn't fetch every time
_jwk_client = None

def _get_jwk_client():
    global _jwk_client
    if _jwk_client is None:
        jwks_url = f"{Config.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client

def verify_supabase_token(token):
    """
    Verify a Supabase access token (ES256 signed) using the project's JWKS.
    Returns the token payload if valid.
    """
    try:
        jwk_client = _get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=['ES256'],
            audience='authenticated'
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError as e:
        raise Exception(f'Invalid token: {str(e)}')

def get_user_profile(user_id):
    try:
        res = supabase_request('GET', f'profiles?id=eq.{user_id}&select=*')
        return res[0] if res else None
    except:
        return None