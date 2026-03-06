from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable validation."""

    # Neo4j Configuration
    neo4j_uri: str = Field(default="bolt://localhost:7687", description="Neo4j connection URI")
    neo4j_username: str = Field(default="neo4j", description="Neo4j username")
    neo4j_password: str = Field(default="password", description="Neo4j password")

    # Redis Configuration
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: str = Field(default="6379", description="Redis port")

    # JWT Configuration
    jwt_secret: str = Field(default="secret", description="JWT secret key for token signing")
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_expiration_minutes: int = Field(default=60, description="JWT token expiration time in minutes")

    # Legacy JWT fields for backward compatibility
    secret_key: str = Field(default="secret", description="Legacy JWT secret key (use jwt_secret)")
    algorithm: str = Field(default="HS256", description="Legacy JWT algorithm (use jwt_algorithm)")

    # CORS Configuration
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://web:3000",
            "http://xr:3001"
        ],
        description="Allowed CORS origins for multiple frontends"
    )

    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)")
    log_file: str = Field(default="app.log", description="Log file path")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is one of the standard Python logging levels."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"log_level must be one of {valid_levels}, got {v}")
        return v_upper

    @field_validator("jwt_expiration_minutes")
    @classmethod
    def validate_jwt_expiration(cls, v: int) -> int:
        """Validate JWT expiration is positive."""
        if v <= 0:
            raise ValueError("jwt_expiration_minutes must be positive")
        return v

    def __init__(self, **kwargs):
        """Initialize settings and sync legacy fields with new JWT fields."""
        super().__init__(**kwargs)
        # Sync legacy fields with new fields for backward compatibility
        if self.jwt_secret != "secret":
            self.secret_key = self.jwt_secret
        elif self.secret_key != "secret":
            self.jwt_secret = self.secret_key

        if self.jwt_algorithm != "HS256":
            self.algorithm = self.jwt_algorithm
        elif self.algorithm != "HS256":
            self.jwt_algorithm = self.algorithm


settings = Settings()
