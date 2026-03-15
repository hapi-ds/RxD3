"""
Skill node model for AI knowledge management.

This module defines the SkillNode type for storing AI skills in Neo4j.
Skills are self-contained units of knowledge, rules, or behavioral guidance
that can be toggled on/off and are consumed by the KnowledgeStore when
generating context prompts for the AI provider.

**Validates: Requirements 10.1, 10.2, 10.4, 10.5**
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from neontology import BaseNode
from pydantic import Field


class SkillNode(BaseNode):
    """Skill node in Neo4j database for AI knowledge management.

    Each Skill represents a self-contained unit of knowledge, rules, or
    behavioral guidance that can be taught to the AI. Skills are independent
    of the Generated_Data hierarchy (BaseMind) and are managed separately
    through the Skill API.

    Attributes:
        uuid: Unique identifier for the skill.
        name: Human-readable skill name (unique across all skills).
        description: Brief description of what the skill does.
        content: Full skill content/knowledge for AI consumption.
        enabled: Whether the skill is active for AI use.
        created_at: Timestamp when the skill was created.
        updated_at: Timestamp of last modification.
        category: Optional category for future grouping.
        skill_type: Optional type classifier for future use.
        skill_tags: Optional tags for future categorization.

    **Validates: Requirements 10.1, 10.2, 10.4, 10.5**
    """

    __primarylabel__: str = "Skill"
    __primaryproperty__: str = "uuid"

    uuid: UUID = Field(
        default_factory=uuid4,
        description="Unique identifier for the skill",
    )
    name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Skill name (unique across all skills)",
    )
    description: str = Field(
        ...,
        min_length=1,
        description="Brief description of what the skill does",
    )
    content: str = Field(
        ...,
        min_length=1,
        description="Full skill content/knowledge for AI consumption",
    )
    enabled: bool = Field(
        default=True,
        description="Whether the skill is active for AI use",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the skill was created",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of last modification",
    )

    # Future extension fields (optional, no migration needed)
    category: Optional[str] = Field(
        default=None,
        description="Optional category for future grouping",
    )
    skill_type: Optional[str] = Field(
        default=None,
        description="Optional type classifier for future use",
    )
    skill_tags: Optional[list[str]] = Field(
        default=None,
        description="Optional tags for future categorization",
    )
