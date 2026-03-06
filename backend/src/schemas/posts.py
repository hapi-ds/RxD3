from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    """Schema for creating a new post."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Post title",
        examples=["My First Blog Post"]
    )
    content: str = Field(
        ...,
        min_length=1,
        description="Post content/body",
        examples=["This is the content of my first blog post. It can be as long as needed."]
    )
    tags: List[str] = Field(
        default=[],
        description="List of tags for categorizing the post",
        examples=[["python", "fastapi", "neo4j"]]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Getting Started with FastAPI",
                    "content": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+",
                    "tags": ["python", "fastapi", "tutorial"]
                }
            ]
        }
    }


class PostUpdate(BaseModel):
    """Schema for updating a post."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Updated post title",
        examples=["My Updated Blog Post"]
    )
    content: str = Field(
        ...,
        min_length=1,
        description="Updated post content/body",
        examples=["This is the updated content of my blog post."]
    )
    tags: List[str] = Field(
        default=[],
        description="Updated list of tags",
        examples=[["python", "fastapi", "neo4j", "updated"]]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "Getting Started with FastAPI - Updated",
                    "content": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+. This guide has been updated with new examples.",
                    "tags": ["python", "fastapi", "tutorial", "updated"]
                }
            ]
        }
    }


class PostResponse(BaseModel):
    """Schema for post response."""

    id: str = Field(
        ...,
        description="Post's unique identifier",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    title: str = Field(
        ...,
        description="Post title",
        examples=["Getting Started with FastAPI"]
    )
    content: str = Field(
        ...,
        description="Post content/body",
        examples=["FastAPI is a modern, fast web framework..."]
    )
    tags: List[str] = Field(
        default=[],
        description="List of tags",
        examples=[["python", "fastapi", "tutorial"]]
    )
    date_created: datetime = Field(
        ...,
        description="Timestamp when the post was created",
        examples=["2024-01-15T10:30:00Z"]
    )
    date_updated: datetime = Field(
        ...,
        description="Timestamp when the post was last updated",
        examples=["2024-01-15T14:20:00Z"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "Getting Started with FastAPI",
                    "content": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+",
                    "tags": ["python", "fastapi", "tutorial"],
                    "date_created": "2024-01-15T10:30:00Z",
                    "date_updated": "2024-01-15T14:20:00Z"
                }
            ]
        }
    }
