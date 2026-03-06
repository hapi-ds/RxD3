"""WebSocket routes for real-time communication.

This module defines the WebSocket endpoint that handles client connections
with JWT authentication, message broadcasting, and connection lifecycle management.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.4**
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from src.auth.jwt_handler import decode_jwt
from src.websocket.manager import ConnectionManager

# Configure logging
logger = logging.getLogger(__name__)

# Create router and connection manager
router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT authentication token")
):
    """WebSocket endpoint for real-time bidirectional communication.

    This endpoint accepts WebSocket connections with JWT token authentication.
    Clients must provide a valid JWT token via the 'token' query parameter.

    Args:
        websocket: The WebSocket connection
        token: JWT authentication token from query parameter

    **Validates: Requirement 4.2** - Validates JWT token using decode_jwt
    **Validates: Requirement 4.3** - Rejects connection with 403 if token invalid
    **Validates: Requirement 4.4** - Extracts email from decoded token
    **Validates: Requirement 4.5** - Accepts tokens via query parameter
    **Validates: Requirement 5.1** - Broadcasts messages to authenticated clients
    **Validates: Requirement 5.2** - Includes sender identity in broadcasts
    **Validates: Requirement 5.4** - Handles disconnection and cleanup
    """
    email: Optional[str] = None

    try:
        # Validate JWT token
        if not token:
            logger.warning("WebSocket connection attempt without token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Decode and validate token
        decoded_token = decode_jwt(token)

        if decoded_token is None:
            logger.warning("WebSocket connection attempt with invalid token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Extract email from decoded token
        email = decoded_token.get("email")

        if not email:
            logger.warning("WebSocket connection attempt with token missing email")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Accept connection and register user
        await manager.connect(websocket, email)
        logger.info(f"WebSocket connection established for user: {email}")

        # Broadcast user joined event to other clients
        join_message = {
            "type": "user_event",
            "event": "joined",
            "email": email,
            "timestamp": datetime.now().isoformat()
        }
        await manager.broadcast(join_message, email)

        # Message receive loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_json()
                logger.debug(f"Received message from {email}: {data}")

                # Prepare broadcast message with sender identity
                broadcast_message = {
                    "type": "message",
                    "sender": email,
                    "content": data.get("content", ""),
                    "timestamp": datetime.now().isoformat()
                }

                # Broadcast to all other connected clients
                await manager.broadcast(broadcast_message, email)
                logger.info(f"Broadcast message from {email} to other clients")

            except ValueError as e:
                # JSON parsing error
                logger.error(f"Invalid JSON from {email}: {e}")
                error_message = {
                    "type": "error",
                    "message": "Invalid message format. Expected JSON.",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_json(error_message)

    except WebSocketDisconnect:
        # Client disconnected normally
        if email:
            logger.info(f"WebSocket disconnected for user: {email}")
            manager.disconnect(email)

            # Broadcast user left event to remaining clients
            leave_message = {
                "type": "user_event",
                "event": "left",
                "email": email,
                "timestamp": datetime.now().isoformat()
            }
            await manager.broadcast(leave_message, email)

    except Exception as e:
        # Unexpected error
        logger.error(f"WebSocket error for user {email}: {e}")
        if email:
            manager.disconnect(email)

        # Try to close the connection gracefully
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
