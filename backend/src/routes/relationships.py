"""
API routes for Relationship operations.

This module defines REST API endpoints for managing relationships between Mind nodes.
"""

from uuid import UUID

from fastapi import APIRouter, status
from fastapi.responses import Response

from ..schemas.mind_generic import RelationshipResponse
from ..services.mind_service import MindService

# Create router
router = APIRouter()

# Initialize service
mind_service = MindService()


@router.get("", response_model=list[RelationshipResponse])
async def list_relationships() -> list[RelationshipResponse]:
    """Get all relationships across all minds."""
    return await mind_service.list_all_relationships()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RelationshipResponse)
async def create_relationship(
    from_uuid: UUID,
    to_uuid: UUID,
    relationship_type: str,
    properties: dict | None = None
) -> RelationshipResponse:
    """Create a new relationship between two minds."""
    result = await mind_service.create_relationship(
        from_uuid=from_uuid,
        to_uuid=to_uuid,
        relationship_type=relationship_type,
        properties=properties or {}
    )
    return result


@router.put("/{relationship_id}", response_model=RelationshipResponse)
async def update_relationship(
    relationship_id: str,
    properties: dict
) -> RelationshipResponse:
    """Update a relationship's properties."""
    # This would need to be implemented in the service
    raise NotImplementedError("Relationship update not yet implemented")


@router.delete("/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relationship(relationship_id: str) -> Response:
    """Delete a relationship."""
    # This would need to be implemented in the service
    raise NotImplementedError("Relationship deletion not yet implemented")
