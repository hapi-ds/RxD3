"""Pydantic schemas for Skill API request and response models.

This module defines the validation schemas used by the Skill API endpoints
for creating, updating, listing, and retrieving AI skills.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.10**
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    """Schema for creating a new skill.

    Attributes:
        name: Human-readable skill name (1–200 characters).
        description: Brief description of what the skill does.
        content: Full skill content/knowledge for AI consumption.
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Skill name (unique across all skills)",
        examples=["NAMD Project Rules"],
    )
    description: str = Field(
        ...,
        min_length=1,
        description="Brief description of what the skill does",
        examples=["Rules for managing NAMD projects"],
    )
    content: str = Field(
        ...,
        min_length=1,
        description="Full skill content/knowledge for AI consumption",
        examples=["A NAMD project should always have non-overlapping phases."],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "NAMD Project Rules",
                    "description": "Rules for managing NAMD projects",
                    "content": "A NAMD project should always have non-overlapping phases: Initiation, Planning, Design, VnV, Design Transfer.",
                }
            ]
        }
    }


class SkillUpdate(BaseModel):
    """Schema for updating an existing skill.

    Attributes:
        name: Updated skill name (1–200 characters).
        description: Updated description of what the skill does.
        content: Updated skill content/knowledge for AI consumption.
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Updated skill name (unique across all skills)",
        examples=["NAMD Project Rules v2"],
    )
    description: str = Field(
        ...,
        min_length=1,
        description="Updated description of what the skill does",
        examples=["Updated rules for managing NAMD projects"],
    )
    content: str = Field(
        ...,
        min_length=1,
        description="Updated skill content/knowledge for AI consumption",
        examples=["A NAMD project must have non-overlapping phases."],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "NAMD Project Rules v2",
                    "description": "Updated rules for managing NAMD projects",
                    "content": "A NAMD project must have non-overlapping phases: Initiation, Planning, Design, VnV, Design Transfer.",
                }
            ]
        }
    }


class SkillListResponse(BaseModel):
    """Schema for skill list items (excludes content for list views).

    Attributes:
        uuid: Unique identifier for the skill.
        name: Human-readable skill name.
        description: Brief description of what the skill does.
        enabled: Whether the skill is active for AI use.
        created_at: Timestamp when the skill was created.
        updated_at: Timestamp of last modification.
    """

    uuid: UUID = Field(
        ...,
        description="Unique identifier for the skill",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    name: str = Field(
        ...,
        description="Skill name",
        examples=["NAMD Project Rules"],
    )
    description: str = Field(
        ...,
        description="Brief description of what the skill does",
        examples=["Rules for managing NAMD projects"],
    )
    enabled: bool = Field(
        ...,
        description="Whether the skill is active for AI use",
        examples=[True],
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the skill was created",
        examples=["2024-01-15T10:30:00Z"],
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification",
        examples=["2024-01-15T14:20:00Z"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "uuid": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "NAMD Project Rules",
                    "description": "Rules for managing NAMD projects",
                    "enabled": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T14:20:00Z",
                }
            ]
        }
    }


class SkillDetailResponse(BaseModel):
    """Schema for full skill detail (includes content).

    Attributes:
        uuid: Unique identifier for the skill.
        name: Human-readable skill name.
        description: Brief description of what the skill does.
        content: Full skill content/knowledge for AI consumption.
        enabled: Whether the skill is active for AI use.
        created_at: Timestamp when the skill was created.
        updated_at: Timestamp of last modification.
    """

    uuid: UUID = Field(
        ...,
        description="Unique identifier for the skill",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    name: str = Field(
        ...,
        description="Skill name",
        examples=["NAMD Project Rules"],
    )
    description: str = Field(
        ...,
        description="Brief description of what the skill does",
        examples=["Rules for managing NAMD projects"],
    )
    content: str = Field(
        ...,
        description="Full skill content/knowledge for AI consumption",
        examples=["A NAMD project should always have non-overlapping phases."],
    )
    enabled: bool = Field(
        ...,
        description="Whether the skill is active for AI use",
        examples=[True],
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the skill was created",
        examples=["2024-01-15T10:30:00Z"],
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification",
        examples=["2024-01-15T14:20:00Z"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "uuid": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "NAMD Project Rules",
                    "description": "Rules for managing NAMD projects",
                    "content": "A NAMD project should always have non-overlapping phases: Initiation, Planning, Design, VnV, Design Transfer.",
                    "enabled": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T14:20:00Z",
                }
            ]
        }
    }


class SkillToggleResponse(BaseModel):
    """Schema for skill toggle response.

    Attributes:
        enabled: The updated enabled status after toggling.
    """

    enabled: bool = Field(
        ...,
        description="The updated enabled status after toggling",
        examples=[False],
    )
