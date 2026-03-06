from uuid import UUID, uuid4

from neontology import BaseNode
from pydantic import EmailStr, Field


class UserNode(BaseNode):
    """User node in Neo4j database."""

    __primarylabel__: str = "User"
    __primaryproperty__: str = "email"

    id: UUID = Field(default_factory=uuid4)
    email: EmailStr
    password: str
    fullname: str
