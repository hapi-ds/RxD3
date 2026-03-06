from typing import Any

from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.jwt_handler import decode_jwt


def verify_jwt(jwtoken: str) -> bool:
    """Verify if JWT token is valid."""
    is_token_valid: bool = False
    payload = decode_jwt(jwtoken)
    if payload:
        is_token_valid = True
    return is_token_valid


class JWTBearer(HTTPBearer):
    """HTTP Bearer authentication with JWT validation."""

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Any:
        credentials: HTTPAuthorizationCredentials | None = await super().__call__(request)

        if credentials is None:
            raise HTTPException(status_code=403, detail="Invalid authorization token")

        print("Credentials:", credentials)

        if not credentials.scheme == "Bearer":
            raise HTTPException(status_code=403, detail="Invalid authentication token")

        if not verify_jwt(credentials.credentials):
            raise HTTPException(status_code=403, detail="Invalid token or expired token")

        return credentials.credentials
