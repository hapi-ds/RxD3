import time
from typing import Dict, Optional

import jwt

from src.config.config import settings


def token_response(token: str) -> Dict[str, str]:
    """Format token response."""
    return {"access_token": token, "type": "Bearer"}


secret_key = settings.jwt_secret
algorithm = settings.jwt_algorithm


def sign_jwt(email: str) -> Dict[str, str]:
    """Generate JWT token for authenticated user.

    Args:
        email: User's email address

    Returns:
        Dictionary with access_token and type
    """
    # Calculate expiration time using configured minutes
    expiration_seconds = settings.jwt_expiration_minutes * 60
    payload = {"email": email, "expires": time.time() + expiration_seconds}
    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    return token_response(token)


def decode_jwt(token: str) -> Optional[dict]:
    """Decode and validate JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload if valid, None if invalid/expired
    """
    try:
        decoded_token = jwt.decode(token, secret_key, algorithms=[algorithm])
        if decoded_token.get("expires", 0) >= time.time():
            return decoded_token
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None
