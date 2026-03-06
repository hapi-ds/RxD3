from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from src.auth.jwt_handler import decode_jwt
from src.models.user import UserNode

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user from JWT token."""
    user = decode_jwt(token=token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    user_exist = UserNode.match(user["email"])

    return user_exist
