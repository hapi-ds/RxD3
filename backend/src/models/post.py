from datetime import datetime
from typing import List
from uuid import UUID, uuid4

from neontology import BaseNode, BaseRelationship
from pydantic import Field

from src.models.user import UserNode


class PosteNode(BaseNode):
    """Post node in Neo4j database."""

    __primarylabel__: str = "Poste"
    __primaryproperty__: str = "id"

    id: UUID = Field(default_factory=uuid4)
    title: str
    content: str
    date_created: datetime = Field(default_factory=datetime.now)
    date_updated: datetime = Field(default_factory=datetime.now)
    tags: List[str]


class Posted(BaseRelationship):
    """Relationship between User and Post."""

    __relationshiptype__: str = "POSTED"

    source: UserNode
    target: PosteNode
