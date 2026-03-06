"""WebSocket message schemas for real-time communication.

This module defines Pydantic models for WebSocket message validation and serialization.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class WSMessage(BaseModel):
    """WebSocket message model for real-time communication.

    Attributes:
        type: Message type - either "message" for user messages or "user_event" for system events
        content: Message content (optional, used for "message" type)
        sender: Email of the message sender (optional, used for "message" type)
        event: Event type for user events (optional, used for "user_event" type)
        email: User email for user events (optional, used for "user_event" type)
        timestamp: Message timestamp, automatically set to current time
    """

    type: Literal["message", "user_event"]
    content: Optional[str] = None
    sender: Optional[str] = None
    event: Optional[Literal["joined", "left"]] = None
    email: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
