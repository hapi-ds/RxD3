"""Skill API endpoints for CRUD and toggle operations.

This module defines the FastAPI router for managing AI Skill nodes
in the Neo4j database. All endpoints require JWT authentication.

**Validates: Requirements 11.1–11.10, 10.3, 10.4**
"""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.deps import get_current_user
from src.models.skill import SkillNode
from src.models.user import UserNode
from src.schemas.skills import (
    SkillCreate,
    SkillDetailResponse,
    SkillListResponse,
    SkillToggleResponse,
    SkillUpdate,
)

skills_router = APIRouter()


@skills_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=SkillDetailResponse,
    summary="Create a new skill",
    description="Create a new AI skill with name, description, and content. "
    "Name must be unique across all skills.",
)
def create_skill(
    skill: SkillCreate,
    user: UserNode = Depends(get_current_user),
) -> SkillDetailResponse:
    """Create a new skill node in the database.

    Args:
        skill: Validated skill creation payload.
        user: Authenticated user from JWT dependency.

    Returns:
        The created skill with all attributes.

    Raises:
        HTTPException: 409 if a skill with the same name already exists.
    """
    existing = SkillNode.match_nodes()
    for s in existing:
        if s.name == skill.name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Skill with name '{skill.name}' already exists",
            )

    node = SkillNode(
        name=skill.name,
        description=skill.description,
        content=skill.content,
    )
    node.create()

    return SkillDetailResponse(
        uuid=node.uuid,
        name=node.name,
        description=node.description,
        content=node.content,
        enabled=node.enabled,
        created_at=node.created_at,
        updated_at=node.updated_at,
    )


@skills_router.get(
    "",
    response_model=List[SkillListResponse],
    summary="List all skills",
    description="Retrieve all skills without content for list views.",
)
def list_skills(
    user: UserNode = Depends(get_current_user),
) -> List[SkillListResponse]:
    """List all skill nodes without content.

    Args:
        user: Authenticated user from JWT dependency.

    Returns:
        List of skills with uuid, name, description, enabled, and timestamps.
    """
    nodes = SkillNode.match_nodes()
    return [
        SkillListResponse(
            uuid=node.uuid,
            name=node.name,
            description=node.description,
            enabled=node.enabled,
            created_at=node.created_at,
            updated_at=node.updated_at,
        )
        for node in nodes
    ]


@skills_router.get(
    "/{skill_uuid}",
    response_model=SkillDetailResponse,
    summary="Get a single skill",
    description="Retrieve a single skill with full content by UUID.",
)
def get_skill(
    skill_uuid: str,
    user: UserNode = Depends(get_current_user),
) -> SkillDetailResponse:
    """Get a single skill node by UUID.

    Args:
        skill_uuid: The UUID of the skill to retrieve.
        user: Authenticated user from JWT dependency.

    Returns:
        The skill with all attributes including content.

    Raises:
        HTTPException: 404 if the skill is not found.
    """
    node = SkillNode.match(skill_uuid)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    return SkillDetailResponse(
        uuid=node.uuid,
        name=node.name,
        description=node.description,
        content=node.content,
        enabled=node.enabled,
        created_at=node.created_at,
        updated_at=node.updated_at,
    )


@skills_router.put(
    "/{skill_uuid}",
    response_model=SkillDetailResponse,
    summary="Update a skill",
    description="Update an existing skill's name, description, and content. "
    "Name must remain unique across all skills.",
)
def update_skill(
    skill_uuid: str,
    skill_update: SkillUpdate,
    user: UserNode = Depends(get_current_user),
) -> SkillDetailResponse:
    """Update an existing skill node.

    Args:
        skill_uuid: The UUID of the skill to update.
        skill_update: Validated skill update payload.
        user: Authenticated user from JWT dependency.

    Returns:
        The updated skill with all attributes.

    Raises:
        HTTPException: 404 if the skill is not found.
        HTTPException: 409 if the new name conflicts with another skill.
    """
    node = SkillNode.match(skill_uuid)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    # Check name uniqueness against other skills
    if skill_update.name != node.name:
        existing = SkillNode.match_nodes()
        for s in existing:
            if s.name == skill_update.name and str(s.uuid) != skill_uuid:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Skill with name '{skill_update.name}' already exists",
                )

    node.name = skill_update.name
    node.description = skill_update.description
    node.content = skill_update.content
    node.updated_at = datetime.now(timezone.utc)
    node.merge()

    return SkillDetailResponse(
        uuid=node.uuid,
        name=node.name,
        description=node.description,
        content=node.content,
        enabled=node.enabled,
        created_at=node.created_at,
        updated_at=node.updated_at,
    )


@skills_router.patch(
    "/{skill_uuid}/toggle",
    response_model=SkillToggleResponse,
    summary="Toggle skill enabled status",
    description="Toggle the enabled/disabled status of a skill.",
)
def toggle_skill(
    skill_uuid: str,
    user: UserNode = Depends(get_current_user),
) -> SkillToggleResponse:
    """Toggle the enabled status of a skill node.

    Args:
        skill_uuid: The UUID of the skill to toggle.
        user: Authenticated user from JWT dependency.

    Returns:
        The updated enabled status.

    Raises:
        HTTPException: 404 if the skill is not found.
    """
    node = SkillNode.match(skill_uuid)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    node.enabled = not node.enabled
    node.updated_at = datetime.now(timezone.utc)
    node.merge()

    return SkillToggleResponse(enabled=node.enabled)


@skills_router.delete(
    "/{skill_uuid}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a skill",
    description="Delete an existing skill by UUID.",
)
def delete_skill(
    skill_uuid: str,
    user: UserNode = Depends(get_current_user),
) -> None:
    """Delete a skill node from the database.

    Args:
        skill_uuid: The UUID of the skill to delete.
        user: Authenticated user from JWT dependency.

    Raises:
        HTTPException: 404 if the skill is not found.
    """
    node = SkillNode.match(skill_uuid)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    SkillNode.delete(skill_uuid)
