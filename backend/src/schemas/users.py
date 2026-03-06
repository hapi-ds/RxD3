from fastapi.security import HTTPBasicCredentials
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    email: EmailStr = Field(
        ...,
        description="User's email address (must be unique)",
        examples=["john.doe@example.com"]
    )
    password: str = Field(
        ...,
        min_length=8,
        description="User's password (minimum 8 characters)",
        examples=["SecurePass123!"]
    )
    fullname: str = Field(
        ...,
        min_length=2,
        description="User's full name",
        examples=["John Doe"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "john.doe@example.com",
                    "password": "SecurePass123!",
                    "fullname": "John Doe"
                }
            ]
        }
    }


class UserUpdate(BaseModel):
    """Schema for updating user information."""

    password: str = Field(
        ...,
        min_length=8,
        description="New password (minimum 8 characters)",
        examples=["NewSecurePass456!"]
    )
    fullname: str = Field(
        ...,
        min_length=2,
        description="Updated full name",
        examples=["John Smith"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "password": "NewSecurePass456!",
                    "fullname": "John Smith"
                }
            ]
        }
    }


class UserSignIn(HTTPBasicCredentials):
    """Schema for user sign-in credentials."""

    class Config:
        json_schema_extra = {
            "example": {"username": "john.doe@example.com", "password": "SecurePass123!"}
        }


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str = Field(
        ...,
        description="JWT access token for authentication",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    )
    token_type: str = Field(
        default="Bearer",
        description="Token type (always 'Bearer')",
        examples=["Bearer"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiZXhwaXJlcyI6MTcwNTMyMDAwMH0.abc123...",
                    "token_type": "Bearer"
                }
            ]
        }
    }


class UserResponse(BaseModel):
    """Schema for user response (without password)."""

    id: str = Field(
        ...,
        description="User's unique identifier (UUID)",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    email: EmailStr = Field(
        ...,
        description="User's email address",
        examples=["john.doe@example.com"]
    )
    fullname: str = Field(
        ...,
        description="User's full name",
        examples=["John Doe"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "john.doe@example.com",
                    "fullname": "John Doe"
                }
            ]
        }
    }
