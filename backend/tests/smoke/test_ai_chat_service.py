"""
Smoke tests for AI Chat Service implementation.

These tests verify basic functionality of the AI Chat Service without
requiring actual AI provider connections.
"""

import pytest

from src.config.config import Settings
from src.services.ai_chat_service import AIChatService
from src.services.knowledge_store import KnowledgeStore


@pytest.fixture
def mock_settings():
    """Create mock settings for testing."""
    return Settings(
        ai_provider="openai",
        ai_api_endpoint="https://api.openai.com/v1",
        ai_api_key="test-key",
        ai_model_name="gpt-4",
        ai_request_timeout=30,
        ai_max_context_tokens=8000,
        ai_max_history_messages=20,
    )


@pytest.fixture
def mock_knowledge_store():
    """Create mock knowledge store for testing."""
    
    class MockKnowledgeStore:
        async def generate_context_prompt(self):
            return "Test context prompt"
        
        async def get_relationship_types(self):
            return ["CONTAINS", "DEPENDS_ON", "ASSIGNED_TO"]
    
    return MockKnowledgeStore()


def test_ai_chat_service_initialization(mock_settings, mock_knowledge_store):
    """Test that AIChatService can be initialized."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    assert service.settings == mock_settings
    assert service.knowledge_store == mock_knowledge_store
    assert len(service.valid_mind_types) > 0


def test_build_messages(mock_settings, mock_knowledge_store):
    """Test message building with context and history."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    user_message = "What are the risks?"
    context_prompt = "Project context here"
    conversation_history = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
    ]
    
    messages = service._build_messages(user_message, context_prompt, conversation_history)
    
    # Should have system message, history, and current message
    assert len(messages) == 4
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == context_prompt
    assert messages[1]["role"] == "user"
    assert messages[1]["content"] == "Hello"
    assert messages[2]["role"] == "assistant"
    assert messages[2]["content"] == "Hi there!"
    assert messages[3]["role"] == "user"
    assert messages[3]["content"] == user_message


def test_build_messages_limits_history(mock_settings, mock_knowledge_store):
    """Test that message history is limited to ai_max_history_messages."""
    mock_settings.ai_max_history_messages = 2
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    # Create history with 5 messages
    conversation_history = [
        {"role": "user", "content": f"Message {i}"}
        for i in range(5)
    ]
    
    messages = service._build_messages("Current message", "Context", conversation_history)
    
    # Should have system + 2 history + current = 4 messages
    assert len(messages) == 4
    # Should keep the most recent 2 history messages
    assert messages[1]["content"] == "Message 3"
    assert messages[2]["content"] == "Message 4"


def test_build_tools(mock_settings, mock_knowledge_store):
    """Test tool definitions are correctly formatted."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    tools = service._build_tools()
    
    assert len(tools) == 2
    
    # Check create_mind_node tool
    create_node_tool = tools[0]
    assert create_node_tool["type"] == "function"
    assert create_node_tool["function"]["name"] == "create_mind_node"
    assert "mind_type" in create_node_tool["function"]["parameters"]["properties"]
    assert "title" in create_node_tool["function"]["parameters"]["properties"]
    
    # Check create_relationship tool
    create_rel_tool = tools[1]
    assert create_rel_tool["type"] == "function"
    assert create_rel_tool["function"]["name"] == "create_relationship"
    assert "source_uuid" in create_rel_tool["function"]["parameters"]["properties"]
    assert "target_uuid" in create_rel_tool["function"]["parameters"]["properties"]


@pytest.mark.asyncio
async def test_validate_tool_call_mind_node(mock_settings, mock_knowledge_store):
    """Test validation of create_mind_node tool calls."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    # Valid mind type
    valid = await service.validate_tool_call(
        "create_mind_node",
        {"mind_type": "task", "title": "Test Task"}
    )
    assert valid is True
    
    # Invalid mind type
    invalid = await service.validate_tool_call(
        "create_mind_node",
        {"mind_type": "invalid_type", "title": "Test"}
    )
    assert invalid is False


@pytest.mark.asyncio
async def test_validate_tool_call_relationship(mock_settings, mock_knowledge_store):
    """Test validation of create_relationship tool calls."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    # Valid relationship type
    valid = await service.validate_tool_call(
        "create_relationship",
        {
            "source_uuid": "123e4567-e89b-12d3-a456-426614174000",
            "target_uuid": "123e4567-e89b-12d3-a456-426614174001",
            "relationship_type": "CONTAINS"
        }
    )
    assert valid is True
    
    # Invalid relationship type
    invalid = await service.validate_tool_call(
        "create_relationship",
        {
            "source_uuid": "123e4567-e89b-12d3-a456-426614174000",
            "target_uuid": "123e4567-e89b-12d3-a456-426614174001",
            "relationship_type": "INVALID_TYPE"
        }
    )
    assert invalid is False


def test_map_openai_error(mock_settings, mock_knowledge_store):
    """Test OpenAI error mapping."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    # Test 401 error
    msg = service._map_openai_error(401, "Unauthorized")
    assert "API key" in msg
    
    # Test 429 error
    msg = service._map_openai_error(429, "Rate limited")
    assert "rate limit" in msg.lower()
    
    # Test 500 error
    msg = service._map_openai_error(500, "Server error")
    assert "experiencing issues" in msg.lower()


def test_map_anthropic_error(mock_settings, mock_knowledge_store):
    """Test Anthropic error mapping."""
    service = AIChatService(mock_settings, mock_knowledge_store)
    
    # Test 401 error
    msg = service._map_anthropic_error(401, "Unauthorized")
    assert "API key" in msg
    
    # Test 429 error
    msg = service._map_anthropic_error(429, "Overloaded")
    assert "overloaded" in msg.lower()
    
    # Test 500 error
    msg = service._map_anthropic_error(500, "Server error")
    assert "experiencing issues" in msg.lower()
