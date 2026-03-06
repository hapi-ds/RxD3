import logging
from uuid import UUID

import bcrypt
from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from src.auth.deps import get_current_user
from src.auth.jwt_handler import sign_jwt
from src.models.user import UserNode
from src.schemas.users import Token, UserCreate, UserResponse, UserUpdate

UserRouter = APIRouter()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


@UserRouter.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
    summary="Register a new user",
    description="""
    Create a new user account with email, password, and full name.

    **Requirements:**
    - Email must be unique (not already registered)
    - Password must be at least 8 characters
    - Full name must be at least 2 characters

    **Returns:**
    - User object with id, email, and fullname (password is not returned)

    **Errors:**
    - 409 Conflict: Email already exists
    """,
    responses={
        201: {
            "description": "User successfully created",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "john.doe@example.com",
                        "fullname": "John Doe"
                    }
                }
            }
        },
        409: {
            "description": "User with this email already exists",
            "content": {
                "application/json": {
                    "example": {"detail": "User with email supplied already exists"}
                }
            }
        }
    }
)
def add_new_user(user: UserCreate):
    """Register a new user."""
    user_exists = UserNode.match(user.email)
    if user_exists:
        raise HTTPException(
            status_code=409, detail="User with email supplied already exists"
        )

    user_create = UserNode(
        email=user.email,
        fullname=user.fullname,
        password=hash_password(user.password)
    )
    user_create.create()
    return UserResponse(
        id=str(user_create.id),
        email=user_create.email,
        fullname=user_create.fullname
    )


@UserRouter.post(
    "/login",
    response_model=Token,
    summary="Login and get JWT token",
    description="""
    Authenticate with email and password to receive a JWT access token.

    **Authentication Flow:**
    1. Provide email (as username) and password
    2. Receive JWT token valid for 40 minutes
    3. Include token in Authorization header for subsequent requests: `Bearer <token>`

    **Request Format:**
    - Content-Type: application/x-www-form-urlencoded
    - Fields: username (email), password

    **Returns:**
    - JWT access token and token type

    **Errors:**
    - 403 Forbidden: Invalid email or password
    - 400 Bad Request: Could not validate credentials
    """,
    responses={
        200: {
            "description": "Login successful, JWT token returned",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "Bearer"
                    }
                }
            }
        },
        403: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {"detail": "Incorrect email or password"}
                }
            }
        }
    }
)
def user_get_token(user_credentiel: OAuth2PasswordRequestForm = Depends()):
    """Login and get JWT token."""
    user_exist = UserNode.match(user_credentiel.username)

    if user_exist:
        try:
            password = verify_password(user_credentiel.password, user_exist.password)
        except Exception as e:
            print(f"Exception {e}")
            logging.error(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )

        if password:
            token_response = sign_jwt(email=user_credentiel.username)
            return Token(
                access_token=token_response["access_token"],
                token_type=token_response.get("type", "Bearer")
            )

        raise HTTPException(status_code=403, detail="Incorrect email or password")

    raise HTTPException(status_code=403, detail="Incorrect email or password")


@UserRouter.delete(
    "/{user_uuid}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user account",
    description="""
    Delete the authenticated user's account.

    **Authentication Required:** Yes (JWT Bearer token)

    **Requirements:**
    - User must be authenticated
    - The user_uuid in the path must match the authenticated user's ID

    **Returns:**
    - 204 No Content on success

    **Errors:**
    - 403 Forbidden: Invalid or expired token
    - 404 Not Found: User does not exist
    - 400 Bad Request: UUID mismatch
    """,
    responses={
        204: {
            "description": "User successfully deleted"
        },
        403: {
            "description": "Authentication failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {"detail": "The user does not exist"}
                }
            }
        }
    }
)
def delete_user(user_uuid: UUID, user: UserNode = Depends(get_current_user)):
    """Delete a user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user does not exist"
        )

    if user.id != user_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provider a valid UUID_USER"
        )

    UserNode.delete(user.email)
    return HTTPException(
        status_code=status.HTTP_204_NO_CONTENT,
        detail=f"User with {user_uuid} was succefull delete"
    )


@UserRouter.put(
    "/{user_uuid}",
    response_model=UserResponse,
    summary="Update user information",
    description="""
    Update the authenticated user's password and/or full name.

    **Authentication Required:** Yes (JWT Bearer token)

    **Requirements:**
    - User must be authenticated
    - The user_uuid in the path must match the authenticated user's ID
    - Password must be at least 8 characters
    - Full name must be at least 2 characters

    **Returns:**
    - Updated user object

    **Errors:**
    - 403 Forbidden: Invalid or expired token
    - 404 Not Found: User does not exist
    - 400 Bad Request: UUID mismatch
    """,
    responses={
        200: {
            "description": "User successfully updated",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "john.doe@example.com",
                        "fullname": "John Smith"
                    }
                }
            }
        },
        403: {
            "description": "Authentication failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid authentication token"}
                }
            }
        }
    }
)
def update_user_information(
    user_uuid: UUID,
    user_update: UserUpdate,
    user: UserNode = Depends(get_current_user)
):
    """Update user information."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user does not exist"
        )

    if user.id != user_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provider a valid UUID_USER"
        )

    user.password = hash_password(user_update.password)
    user.fullname = user_update.fullname
    user.merge()
    return UserResponse(
        id=str(user.id),
        email=user.email,
        fullname=user.fullname
    )
