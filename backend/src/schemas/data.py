"""Pydantic schemas for Save/Read/Clear API request and response models.

This module defines the validation schemas used by the Data API endpoints
for exporting (save), importing (read), and clearing Generated_Data
(Mind nodes, relationships, and Post nodes) in the Neo4j database.

All datetime fields use ISO 8601 format with UTC timezone to ensure
round-trip consistency.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1, 6.6, 7.2, 7.3**
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class MindExport(BaseModel):
    """A Mind node as serialized in the save file.

    Attributes:
        uuid: Unique identifier for the Mind node.
        mind_type: The specific Mind type label (e.g., "Task", "Project").
        title: Human-readable name for the Mind node.
        version: Auto-incrementing version number.
        created_at: Timestamp when the node was first created (ISO 8601 UTC).
        updated_at: Timestamp of last modification (ISO 8601 UTC).
        creator: User identifier who created the node.
        status: Current lifecycle state (draft, active, archived, deleted).
        description: Optional detailed description.
        tags: Optional list of tags for categorization.
        type_specific_attributes: Additional attributes specific to the Mind type.
    """

    uuid: UUID = Field(
        ...,
        description="Unique identifier for the Mind node",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    mind_type: str = Field(
        ...,
        description="The specific Mind type label (e.g., 'Task', 'Project')",
        examples=["Task"],
    )
    title: str = Field(
        ...,
        description="Human-readable name for the Mind node",
        examples=["Design Phase"],
    )
    version: int = Field(
        ...,
        description="Auto-incrementing version number",
        examples=[1],
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the node was first created (ISO 8601 UTC)",
        examples=["2024-01-15T10:30:00Z"],
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification (ISO 8601 UTC)",
        examples=["2024-01-15T14:20:00Z"],
    )
    creator: str = Field(
        ...,
        description="User identifier who created the node",
        examples=["user@example.com"],
    )
    status: str = Field(
        ...,
        description="Current lifecycle state (draft, active, archived, deleted)",
        examples=["active"],
    )
    description: str | None = Field(
        default=None,
        description="Optional detailed description",
        examples=["Design phase for the NAMD project"],
    )
    tags: list[str] | None = Field(
        default=None,
        description="Optional list of tags for categorization",
        examples=[["design", "namd"]],
    )
    type_specific_attributes: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional attributes specific to the Mind type",
        examples=[{"priority": "high", "effort": 5}],
    )


class RelationshipExport(BaseModel):
    """A relationship as serialized in the save file.

    Attributes:
        source_uuid: UUID of the source node.
        target_uuid: UUID of the target node.
        relationship_type: Neo4j relationship type label.
        properties: Additional relationship-specific properties.
    """

    source_uuid: UUID = Field(
        ...,
        description="UUID of the source node",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    target_uuid: UUID = Field(
        ...,
        description="UUID of the target node",
        examples=["660e8400-e29b-41d4-a716-446655440001"],
    )
    relationship_type: str = Field(
        ...,
        description="Neo4j relationship type label",
        examples=["CONTAINS"],
    )
    properties: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional relationship-specific properties",
        examples=[{"level": 1}],
    )


class PostExport(BaseModel):
    """A Post node as serialized in the save file.

    Attributes:
        id: Unique identifier for the Post node.
        title: Post title.
        content: Post content/body.
        tags: List of tags for categorizing the post.
        date_created: Timestamp when the post was created (ISO 8601 UTC).
        date_updated: Timestamp when the post was last updated (ISO 8601 UTC).
    """

    id: UUID = Field(
        ...,
        description="Unique identifier for the Post node",
        examples=["770e8400-e29b-41d4-a716-446655440002"],
    )
    title: str = Field(
        ...,
        description="Post title",
        examples=["Getting Started with FastAPI"],
    )
    content: str = Field(
        ...,
        description="Post content/body",
        examples=["FastAPI is a modern, fast web framework..."],
    )
    tags: list[str] = Field(
        default_factory=list,
        description="List of tags for categorizing the post",
        examples=[["python", "fastapi"]],
    )
    date_created: datetime = Field(
        ...,
        description="Timestamp when the post was created (ISO 8601 UTC)",
        examples=["2024-01-15T10:30:00Z"],
    )
    date_updated: datetime = Field(
        ...,
        description="Timestamp when the post was last updated (ISO 8601 UTC)",
        examples=["2024-01-15T14:20:00Z"],
    )


class SaveFileData(BaseModel):
    """Top-level structure of the save file.

    Contains all Generated_Data: Mind nodes, relationships, and Post nodes.
    User data and Skill nodes are excluded from this structure.

    Attributes:
        minds: List of exported Mind nodes.
        relationships: List of exported relationships between Mind nodes.
        posts: List of exported Post nodes.
    """

    minds: list[MindExport] = Field(
        default_factory=list,
        description="List of exported Mind nodes",
    )
    relationships: list[RelationshipExport] = Field(
        default_factory=list,
        description="List of exported relationships between Mind nodes",
    )
    posts: list[PostExport] = Field(
        default_factory=list,
        description="List of exported Post nodes",
    )


class ReadResponse(BaseModel):
    """Response from the read endpoint.

    Returns counts of restored entities after importing a save file.

    Attributes:
        minds_count: Number of Mind nodes restored.
        relationships_count: Number of relationships restored.
        posts_count: Number of Post nodes restored.
    """

    minds_count: int = Field(
        ...,
        description="Number of Mind nodes restored",
        examples=[42],
    )
    relationships_count: int = Field(
        ...,
        description="Number of relationships restored",
        examples=[15],
    )
    posts_count: int = Field(
        ...,
        description="Number of Post nodes restored",
        examples=[7],
    )


class ClearResponse(BaseModel):
    """Response from the clear endpoint.

    Returns counts of deleted entities after clearing Generated_Data.

    Attributes:
        minds_deleted: Number of Mind nodes deleted.
        relationships_deleted: Number of relationships deleted.
        posts_deleted: Number of Post nodes deleted.
    """

    minds_deleted: int = Field(
        ...,
        description="Number of Mind nodes deleted",
        examples=[42],
    )
    relationships_deleted: int = Field(
        ...,
        description="Number of relationships deleted",
        examples=[15],
    )
    posts_deleted: int = Field(
        ...,
        description="Number of Post nodes deleted",
        examples=[7],
    )
