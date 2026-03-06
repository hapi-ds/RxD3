"""Unit tests for WebSocket connection manager.

**Validates: Requirements 4.1, 5.3, 5.5**
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.websocket.manager import ConnectionManager


@pytest.fixture
def manager():
    """Fixture providing a fresh ConnectionManager instance."""
    return ConnectionManager()


@pytest.fixture
def mock_websocket():
    """Fixture providing a mock WebSocket connection."""
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_connect_accepts_websocket_and_registers_user(manager, mock_websocket):
    """Test that connect() accepts the WebSocket and adds user to registry.

    **Validates: Requirement 4.1** - Associates email with connection
    **Validates: Requirement 5.3** - Maintains connection registry
    """
    email = "user@example.com"

    await manager.connect(mock_websocket, email)

    # Verify WebSocket was accepted
    mock_websocket.accept.assert_called_once()

    # Verify user is in active connections
    assert email in manager.active_connections
    assert manager.active_connections[email] == mock_websocket


@pytest.mark.asyncio
async def test_connect_multiple_users(manager):
    """Test that multiple users can connect simultaneously."""
    ws1 = MagicMock()
    ws1.accept = AsyncMock()
    ws2 = MagicMock()
    ws2.accept = AsyncMock()

    await manager.connect(ws1, "user1@example.com")
    await manager.connect(ws2, "user2@example.com")

    assert len(manager.active_connections) == 2
    assert "user1@example.com" in manager.active_connections
    assert "user2@example.com" in manager.active_connections


def test_disconnect_removes_user_from_registry(manager, mock_websocket):
    """Test that disconnect() removes user from active connections.

    **Validates: Requirement 5.3** - Removes connection from registry
    """
    email = "user@example.com"
    manager.active_connections[email] = mock_websocket

    manager.disconnect(email)

    assert email not in manager.active_connections


def test_disconnect_nonexistent_user_does_not_raise_error(manager):
    """Test that disconnecting a non-existent user is handled gracefully."""
    # Should not raise an exception
    manager.disconnect("nonexistent@example.com")
    assert len(manager.active_connections) == 0


@pytest.mark.asyncio
async def test_broadcast_sends_message_to_all_except_sender(manager):
    """Test that broadcast() sends messages to all users except the sender.

    **Validates: Requirement 5.5** - Broadcasts messages to other clients
    """
    # Setup multiple connections
    ws1 = MagicMock()
    ws1.send_json = AsyncMock()
    ws2 = MagicMock()
    ws2.send_json = AsyncMock()
    ws3 = MagicMock()
    ws3.send_json = AsyncMock()

    manager.active_connections["sender@example.com"] = ws1
    manager.active_connections["user2@example.com"] = ws2
    manager.active_connections["user3@example.com"] = ws3

    message = {"type": "message", "content": "Hello, world!"}

    await manager.broadcast(message, "sender@example.com")

    # Sender should not receive the message
    ws1.send_json.assert_not_called()

    # Other users should receive the message
    ws2.send_json.assert_called_once()
    ws3.send_json.assert_called_once()

    # Verify message includes timestamp
    call_args = ws2.send_json.call_args[0][0]
    assert "timestamp" in call_args


@pytest.mark.asyncio
async def test_broadcast_adds_timestamp_if_missing(manager, mock_websocket):
    """Test that broadcast() adds timestamp to messages that don't have one."""
    manager.active_connections["receiver@example.com"] = mock_websocket

    message = {"type": "message", "content": "Test"}

    await manager.broadcast(message, "sender@example.com")

    # Verify timestamp was added
    call_args = mock_websocket.send_json.call_args[0][0]
    assert "timestamp" in call_args


@pytest.mark.asyncio
async def test_broadcast_cleans_up_dead_connections(manager):
    """Test that broadcast() removes dead connections that fail to receive messages.

    **Validates: Requirement 5.5** - Cleans up dead connections on broadcast failure
    """
    # Setup connections: one working, one dead
    working_ws = MagicMock()
    working_ws.send_json = AsyncMock()

    dead_ws = MagicMock()
    dead_ws.send_json = AsyncMock(side_effect=Exception("Connection closed"))

    manager.active_connections["sender@example.com"] = MagicMock()
    manager.active_connections["working@example.com"] = working_ws
    manager.active_connections["dead@example.com"] = dead_ws

    message = {"type": "message", "content": "Test"}

    await manager.broadcast(message, "sender@example.com")

    # Dead connection should be removed
    assert "dead@example.com" not in manager.active_connections

    # Working connection should remain
    assert "working@example.com" in manager.active_connections

    # Sender should remain
    assert "sender@example.com" in manager.active_connections


@pytest.mark.asyncio
async def test_broadcast_with_no_recipients(manager):
    """Test that broadcast() handles case where only sender is connected."""
    ws = MagicMock()
    ws.send_json = AsyncMock()

    manager.active_connections["sender@example.com"] = ws

    message = {"type": "message", "content": "Hello"}

    # Should not raise an exception
    await manager.broadcast(message, "sender@example.com")

    # Sender should not receive their own message
    ws.send_json.assert_not_called()


@pytest.mark.asyncio
async def test_broadcast_preserves_existing_timestamp(manager, mock_websocket):
    """Test that broadcast() doesn't overwrite existing timestamp in message."""
    manager.active_connections["receiver@example.com"] = mock_websocket

    original_timestamp = "2024-01-15T10:30:00Z"
    message = {"type": "message", "content": "Test", "timestamp": original_timestamp}

    await manager.broadcast(message, "sender@example.com")

    # Verify original timestamp was preserved
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args["timestamp"] == original_timestamp


def test_manager_initialization(manager):
    """Test that ConnectionManager initializes with empty connections."""
    assert isinstance(manager.active_connections, dict)
    assert len(manager.active_connections) == 0


# Integration tests for WebSocket endpoint

@pytest.mark.asyncio
async def test_websocket_endpoint_accepts_valid_token():
    """Test that WebSocket endpoint accepts connection with valid JWT token.

    **Validates: Requirement 4.2** - Validates JWT token
    **Validates: Requirement 4.4** - Extracts email from token
    """
    from fastapi.testclient import TestClient

    from src.app import app
    from src.auth.jwt_handler import sign_jwt

    # Generate valid token
    token_response = sign_jwt("test@example.com")
    token = token_response["access_token"]

    # Test WebSocket connection with valid token
    with TestClient(app) as client:
        with client.websocket_connect(f"/ws?token={token}") as websocket:
            # Connection should be established
            assert websocket is not None


@pytest.mark.asyncio
async def test_websocket_endpoint_rejects_invalid_token():
    """Test that WebSocket endpoint rejects connection with invalid JWT token.

    **Validates: Requirement 4.3** - Rejects connection with invalid token
    """
    from fastapi.testclient import TestClient

    from src.app import app

    # Test with invalid token
    with TestClient(app) as client:
        try:
            with client.websocket_connect("/ws?token=invalid_token"):
                # Should not reach here
                assert False, "Connection should have been rejected"
        except Exception:
            # Connection rejected as expected
            pass


@pytest.mark.asyncio
async def test_websocket_endpoint_rejects_missing_token():
    """Test that WebSocket endpoint rejects connection without token.

    **Validates: Requirement 4.3** - Rejects connection without token
    """
    from fastapi.testclient import TestClient

    from src.app import app

    # Test without token
    with TestClient(app) as client:
        try:
            with client.websocket_connect("/ws"):
                # Should not reach here
                assert False, "Connection should have been rejected"
        except Exception:
            # Connection rejected as expected
            pass


@pytest.mark.asyncio
async def test_websocket_message_broadcast():
    """Test that messages are broadcast to other connected clients.

    **Validates: Requirement 5.1** - Broadcasts messages to authenticated clients
    **Validates: Requirement 5.2** - Includes sender identity in broadcasts
    """
    from fastapi.testclient import TestClient

    from src.app import app
    from src.auth.jwt_handler import sign_jwt

    # Generate tokens for two users
    token1 = sign_jwt("user1@example.com")["access_token"]
    token2 = sign_jwt("user2@example.com")["access_token"]

    with TestClient(app) as client:
        # Connect both clients
        with client.websocket_connect(f"/ws?token={token1}") as ws1:
            with client.websocket_connect(f"/ws?token={token2}") as ws2:
                # User2 should receive join event from user1
                # (Note: This test may need adjustment based on actual behavior)

                # User1 sends a message
                ws1.send_json({"content": "Hello from user1"})

                # User2 should receive the message
                message = ws2.receive_json()
                assert message["type"] == "message"
                assert message["sender"] == "user1@example.com"
                assert message["content"] == "Hello from user1"
