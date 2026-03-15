"""Data API endpoints for Save, Read, and Clear operations.

This module defines the FastAPI router for exporting (save), importing (read),
and clearing Generated_Data (Mind nodes, relationships, and Post nodes)
in the Neo4j database. All endpoints require JWT authentication.

User nodes and Skill nodes are never affected by these operations.

**Validates: Requirements 5.1–5.8, 6.1–6.9, 7.1–7.4, 15.1–15.9**
"""

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from neontology import GraphConnection

import neo4j.time

from src.auth.deps import get_current_user
from src.models.user import UserNode
from src.schemas.data import (
    ClearResponse,
    ReadResponse,
    SaveFileData,
    MindExport,
    RelationshipExport,
    PostExport,
)

logger = logging.getLogger(__name__)

data_router = APIRouter()


def _to_python_datetime(value: Any) -> datetime | None:
    """Convert a neo4j.time.DateTime to Python datetime, or return as-is.

    Args:
        value: A datetime-like value from Neo4j or Python.

    Returns:
        A Python datetime, or None if the value is falsy.
    """
    if value is None:
        return None
    if isinstance(value, (neo4j.time.DateTime, neo4j.time.Date)):
        return value.to_native()
    return value


def _sanitize_neo4j_value(value: Any) -> Any:
    """Convert any neo4j-specific types to Python-native equivalents.

    Args:
        value: Any value that may be a neo4j type.

    Returns:
        Python-native equivalent.
    """
    if isinstance(value, (neo4j.time.DateTime, neo4j.time.Date)):
        return value.to_native()
    if isinstance(value, neo4j.time.Duration):
        return str(value)
    if isinstance(value, dict):
        return {k: _sanitize_neo4j_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_neo4j_value(v) for v in value]
    return value


def _execute_cypher(cypher: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Execute a Cypher query and return records as list of dicts.

    Args:
        cypher: Cypher query string.
        params: Optional query parameters.

    Returns:
        List of record dicts from the query result.

    Raises:
        HTTPException: 503 if the database query fails.
    """
    gc = GraphConnection()
    try:
        results = gc.engine.evaluate_query(cypher, params or {})
        if results and results.records_raw:
            return [dict(record) for record in results.records_raw]
        return []
    except Exception as e:
        logger.error("Database query failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )


@data_router.get(
    "/save",
    response_model=SaveFileData,
    summary="Save all Generated_Data",
    description="Export all Mind nodes, relationships, and Post nodes as JSON. "
    "Excludes User and Skill nodes.",
)
def save_data(
    user: UserNode = Depends(get_current_user),
) -> SaveFileData:
    """Export all Generated_Data from the database.

    Queries all Mind nodes (excluding User, Skill, Poste labels),
    their relationships, and all Post nodes. Returns a JSON structure
    suitable for saving to a file.

    Args:
        user: Authenticated user from JWT dependency.

    Returns:
        SaveFileData containing minds, relationships, and posts arrays.

    Raises:
        HTTPException: 503 if the database is unavailable.
    """
    # Query Mind nodes
    mind_cypher = (
        "MATCH (m) "
        "WHERE m.uuid IS NOT NULL AND m.title IS NOT NULL AND m.version IS NOT NULL "
        "AND NOT m:User AND NOT m:Skill AND NOT m:Poste "
        "RETURN m, labels(m) AS labels"
    )
    mind_records = _execute_cypher(mind_cypher)

    minds: list[MindExport] = []
    for record in mind_records:
        node = record["m"]
        labels = record["labels"]
        # Determine mind_type from labels (first non-"Mind" label, or "Mind")
        mind_type = "Mind"
        for label in labels:
            if label != "Mind":
                mind_type = label
                break

        # Extract known base properties
        props = dict(node) if hasattr(node, "__iter__") else {}
        if hasattr(node, "_properties"):
            props = dict(node._properties)
        elif hasattr(node, "items"):
            props = dict(node.items())
        else:
            # neo4j Node object — access via dict()
            props = dict(node)

        # Skip nodes missing a valid uuid
        node_uuid = props.get("uuid")
        if not node_uuid:
            logger.warning("Skipping node without uuid: %s", props.get("title"))
            continue

        base_keys = {
            "uuid", "title", "version", "created_at", "updated_at",
            "creator", "status", "description", "tags",
        }
        type_specific = {
            k: _sanitize_neo4j_value(v)
            for k, v in props.items() if k not in base_keys
        }

        now = datetime.now(timezone.utc)
        try:
            minds.append(MindExport(
                uuid=node_uuid,
                mind_type=mind_type,
                title=props.get("title", ""),
                version=props.get("version", 1),
                created_at=_to_python_datetime(props.get("created_at")) or now,
                updated_at=_to_python_datetime(props.get("updated_at")) or now,
                creator=props.get("creator", ""),
                status=props.get("status", "draft"),
                description=props.get("description"),
                tags=props.get("tags"),
                type_specific_attributes=type_specific,
            ))
        except (ValueError, TypeError) as e:
            logger.warning("Skipping invalid mind node %s: %s", node_uuid, e)

    # Query relationships between Mind nodes
    rel_cypher = (
        "MATCH (s)-[r]->(t) "
        "WHERE s.uuid IS NOT NULL AND t.uuid IS NOT NULL "
        "AND s.title IS NOT NULL AND s.version IS NOT NULL "
        "AND t.title IS NOT NULL AND t.version IS NOT NULL "
        "AND NOT s:User AND NOT s:Skill AND NOT s:Poste "
        "AND NOT t:User AND NOT t:Skill AND NOT t:Poste "
        "RETURN type(r) AS rel_type, s.uuid AS source_uuid, "
        "t.uuid AS target_uuid, properties(r) AS props"
    )
    rel_records = _execute_cypher(rel_cypher)

    relationships: list[RelationshipExport] = []
    for record in rel_records:
        relationships.append(RelationshipExport(
            source_uuid=record["source_uuid"],
            target_uuid=record["target_uuid"],
            relationship_type=record["rel_type"],
            properties=_sanitize_neo4j_value(record.get("props") or {}),
        ))

    # Query Post nodes
    post_cypher = "MATCH (p:Poste) RETURN p"
    post_records = _execute_cypher(post_cypher)

    posts: list[PostExport] = []
    for record in post_records:
        node = record["p"]
        props = dict(node)
        post_id = props.get("id")
        if not post_id:
            logger.warning("Skipping post without id: %s", props.get("title"))
            continue
        now = datetime.now(timezone.utc)
        try:
            posts.append(PostExport(
                id=post_id,
                title=props.get("title", ""),
                content=props.get("content", ""),
                tags=props.get("tags", []),
                date_created=_to_python_datetime(props.get("date_created")) or now,
                date_updated=_to_python_datetime(props.get("date_updated")) or now,
            ))
        except (ValueError, TypeError) as e:
            logger.warning("Skipping invalid post %s: %s", post_id, e)

    return SaveFileData(minds=minds, relationships=relationships, posts=posts)


@data_router.post(
    "/read",
    response_model=ReadResponse,
    summary="Read Generated_Data from JSON",
    description="Import Mind nodes, relationships, and Post nodes from a JSON body. "
    "Preserves existing User and Skill nodes.",
)
def read_data(
    data: SaveFileData,
    user: UserNode = Depends(get_current_user),
) -> ReadResponse:
    """Import Generated_Data into the database from a save file structure.

    Creates or merges Mind nodes, relationships, and Post nodes.
    User and Skill nodes are never modified.

    Args:
        data: Validated SaveFileData containing minds, relationships, and posts.
        user: Authenticated user from JWT dependency.

    Returns:
        ReadResponse with counts of restored entities.

    Raises:
        HTTPException: 503 if the database is unavailable.
    """
    minds_count = 0
    relationships_count = 0
    posts_count = 0

    # Import Mind nodes
    for mind in data.minds:
        labels = f"Mind:{mind.mind_type}" if mind.mind_type != "Mind" else "Mind"
        # Build properties map
        props: dict[str, Any] = {
            "uuid": str(mind.uuid),
            "title": mind.title,
            "version": mind.version,
            "created_at": mind.created_at.isoformat() if mind.created_at else None,
            "updated_at": mind.updated_at.isoformat() if mind.updated_at else None,
            "creator": mind.creator,
            "status": mind.status,
        }
        if mind.description is not None:
            props["description"] = mind.description
        if mind.tags is not None:
            props["tags"] = mind.tags
        # Add type-specific attributes
        for k, v in mind.type_specific_attributes.items():
            props[k] = v

        cypher = (
            f"MERGE (m:{labels} {{uuid: $uuid}}) "
            "SET m += $props"
        )
        _execute_cypher(cypher, {"uuid": str(mind.uuid), "props": props})
        minds_count += 1

    # Import relationships
    for rel in data.relationships:
        cypher = (
            "MATCH (s {uuid: $source_uuid}), (t {uuid: $target_uuid}) "
            f"MERGE (s)-[r:{rel.relationship_type}]->(t) "
            "SET r += $props"
        )
        _execute_cypher(cypher, {
            "source_uuid": str(rel.source_uuid),
            "target_uuid": str(rel.target_uuid),
            "props": rel.properties or {},
        })
        relationships_count += 1

    # Import Post nodes
    for post in data.posts:
        post_props: dict[str, Any] = {
            "id": str(post.id),
            "title": post.title,
            "content": post.content,
            "tags": post.tags,
            "date_created": post.date_created.isoformat() if post.date_created else None,
            "date_updated": post.date_updated.isoformat() if post.date_updated else None,
        }
        cypher = (
            "MERGE (p:Poste {id: $id}) "
            "SET p += $props"
        )
        _execute_cypher(cypher, {"id": str(post.id), "props": post_props})
        posts_count += 1

    return ReadResponse(
        minds_count=minds_count,
        relationships_count=relationships_count,
        posts_count=posts_count,
    )


@data_router.delete(
    "/clear",
    response_model=ClearResponse,
    summary="Clear all Generated_Data",
    description="Delete all Mind nodes, their relationships, and Post nodes. "
    "Preserves User and Skill nodes.",
)
def clear_data(
    user: UserNode = Depends(get_current_user),
) -> ClearResponse:
    """Delete all Generated_Data from the database.

    Removes all Mind nodes (with DETACH DELETE to remove relationships)
    and all Post nodes. User and Skill nodes are preserved.

    Args:
        user: Authenticated user from JWT dependency.

    Returns:
        ClearResponse with counts of deleted entities.

    Raises:
        HTTPException: 503 if the database is unavailable.
    """
    # Count and delete Mind nodes (DETACH DELETE removes relationships too)
    # First count relationships for reporting
    rel_count_cypher = (
        "MATCH (s)-[r]->(t) "
        "WHERE s.uuid IS NOT NULL AND s.title IS NOT NULL AND s.version IS NOT NULL "
        "AND NOT s:User AND NOT s:Skill AND NOT s:Poste "
        "AND t.uuid IS NOT NULL AND t.title IS NOT NULL AND t.version IS NOT NULL "
        "AND NOT t:User AND NOT t:Skill AND NOT t:Poste "
        "RETURN count(r) AS rel_count"
    )
    rel_records = _execute_cypher(rel_count_cypher)
    relationships_deleted = rel_records[0]["rel_count"] if rel_records else 0

    # Count Mind nodes before deletion
    mind_count_cypher = (
        "MATCH (m) "
        "WHERE m.uuid IS NOT NULL AND m.title IS NOT NULL AND m.version IS NOT NULL "
        "AND NOT m:User AND NOT m:Skill AND NOT m:Poste "
        "RETURN count(m) AS mind_count"
    )
    mind_records = _execute_cypher(mind_count_cypher)
    minds_deleted = mind_records[0]["mind_count"] if mind_records else 0

    # Delete Mind nodes with DETACH DELETE
    if minds_deleted > 0:
        delete_minds_cypher = (
            "MATCH (m) "
            "WHERE m.uuid IS NOT NULL AND m.title IS NOT NULL AND m.version IS NOT NULL "
            "AND NOT m:User AND NOT m:Skill AND NOT m:Poste "
            "DETACH DELETE m"
        )
        _execute_cypher(delete_minds_cypher)

    # Count Post nodes before deletion
    post_count_cypher = "MATCH (p:Poste) RETURN count(p) AS post_count"
    post_records = _execute_cypher(post_count_cypher)
    posts_deleted = post_records[0]["post_count"] if post_records else 0

    # Delete Post nodes
    if posts_deleted > 0:
        delete_posts_cypher = "MATCH (p:Poste) DETACH DELETE p"
        _execute_cypher(delete_posts_cypher)

    return ClearResponse(
        minds_deleted=minds_deleted,
        relationships_deleted=relationships_deleted,
        posts_deleted=posts_deleted,
    )
