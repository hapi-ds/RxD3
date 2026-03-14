"""
Unit tests for KnowledgeStore context formatting methods.

This test file verifies the context formatting methods implemented in Task 2.2:
- format_relationships()
- format_risks()
- _estimate_token_count()
- generate_context_prompt()

**Validates: Requirements 2.4, 2.5, 2.7, 2.8**
"""

from unittest.mock import AsyncMock, patch

import pytest

from src.services.knowledge_store import KnowledgeStore


class TestFormatRelationships:
    """Tests for format_relationships method."""

    def test_format_relationships_with_data(self):
        """Test format_relationships with valid relationship types."""
        store = KnowledgeStore()
        relationships = ["CONTAINS", "DEPENDS_ON", "ASSIGNED_TO"]
        result = store.format_relationships(relationships)
        
        assert "Available relationship types:" in result
        assert "CONTAINS" in result
        assert "DEPENDS_ON" in result
        assert "ASSIGNED_TO" in result

    def test_format_relationships_empty(self):
        """Test format_relationships with empty list."""
        store = KnowledgeStore()
        result = store.format_relationships([])
        
        assert result == "Available relationship types: None"

    def test_format_relationships_single(self):
        """Test format_relationships with single relationship type."""
        store = KnowledgeStore()
        result = store.format_relationships(["CONTAINS"])
        
        assert result == "Available relationship types: CONTAINS"


class TestFormatRisks:
    """Tests for format_risks method."""

    def test_format_risks_with_complete_data(self):
        """Test format_risks with complete risk data."""
        store = KnowledgeStore()
        risks = [
            {
                "title": "SQL Injection Risk",
                "severity": "High",
                "probability": "Medium",
                "description": "Potential SQL injection vulnerability",
                "mitigation_plan": "Use parameterized queries"
            },
            {
                "title": "Authentication Bypass",
                "severity": "Critical",
                "probability": "Low",
                "description": "Weak authentication mechanism",
                "mitigation_plan": "Implement MFA"
            }
        ]
        result = store.format_risks(risks)
        
        assert "Risk Analyses:" in result
        assert "SQL Injection Risk" in result
        assert "Authentication Bypass" in result
        assert "High" in result
        assert "Critical" in result
        assert "Use parameterized queries" in result
        assert "Implement MFA" in result

    def test_format_risks_empty(self):
        """Test format_risks with empty list."""
        store = KnowledgeStore()
        result = store.format_risks([])
        
        assert result == "Risk Analyses: None"

    def test_format_risks_handles_missing_fields(self):
        """Test format_risks handles risks with missing optional fields."""
        store = KnowledgeStore()
        risks = [
            {
                "title": "Minimal Risk",
                "severity": "Low",
                "probability": "Low"
                # No description or mitigation_plan
            }
        ]
        result = store.format_risks(risks)
        
        assert "Minimal Risk" in result
        assert "Low" in result
        # Should not crash with missing fields

    def test_format_risks_with_empty_strings(self):
        """Test format_risks handles empty string values."""
        store = KnowledgeStore()
        risks = [
            {
                "title": "Risk with Empty Fields",
                "severity": "Medium",
                "probability": "High",
                "description": "",
                "mitigation_plan": ""
            }
        ]
        result = store.format_risks(risks)
        
        assert "Risk with Empty Fields" in result
        assert "Medium" in result
        # Empty strings should not be included


class TestEstimateTokenCount:
    """Tests for _estimate_token_count method."""

    def test_estimate_token_count_basic(self):
        """Test token count estimation with known word count."""
        store = KnowledgeStore()
        
        # Test with known word count: 10 words
        text = "This is a test with ten words in the sentence"
        token_count = store._estimate_token_count(text)
        
        # 10 words / 0.75 = 13.33... = 13 tokens
        assert token_count == 13

    def test_estimate_token_count_empty(self):
        """Test token count estimation with empty string."""
        store = KnowledgeStore()
        assert store._estimate_token_count("") == 0

    def test_estimate_token_count_single_word(self):
        """Test token count estimation with single word."""
        store = KnowledgeStore()
        # 1 word / 0.75 = 1.33... = 1 token
        assert store._estimate_token_count("word") == 1

    def test_estimate_token_count_multiple_spaces(self):
        """Test token count estimation handles multiple spaces."""
        store = KnowledgeStore()
        # Multiple spaces should be treated as single separator
        text = "word1    word2     word3"
        token_count = store._estimate_token_count(text)
        # 3 words / 0.75 = 4 tokens
        assert token_count == 4


class TestGenerateContextPrompt:
    """Tests for generate_context_prompt method."""

    @pytest.mark.asyncio
    async def test_generate_context_prompt_structure(self):
        """Test generate_context_prompt returns properly structured text."""
        store = KnowledgeStore()
        
        # Mock the data retrieval methods
        with patch.object(store, 'get_relationship_types', new_callable=AsyncMock) as mock_rels, \
             patch.object(store, 'get_mind_node_types', new_callable=AsyncMock) as mock_nodes, \
             patch.object(store, 'get_risk_analyses', new_callable=AsyncMock) as mock_risks:
            
            mock_rels.return_value = ["CONTAINS", "DEPENDS_ON"]
            mock_nodes.return_value = ["Project", "Task", "Risk"]
            mock_risks.return_value = [
                {
                    "title": "Test Risk",
                    "severity": "High",
                    "probability": "Medium",
                    "description": "Test description",
                    "mitigation_plan": "Test mitigation"
                }
            ]
            
            result = await store.generate_context_prompt()
            
            assert isinstance(result, str)
            assert "Project Context" in result
            assert "Graph Schema" in result
            assert "CONTAINS" in result
            assert "DEPENDS_ON" in result
            assert "Project" in result
            assert "Task" in result
            assert "Test Risk" in result

    @pytest.mark.asyncio
    async def test_generate_context_prompt_empty_data(self):
        """Test generate_context_prompt with empty data."""
        store = KnowledgeStore()
        
        with patch.object(store, 'get_relationship_types', new_callable=AsyncMock) as mock_rels, \
             patch.object(store, 'get_mind_node_types', new_callable=AsyncMock) as mock_nodes, \
             patch.object(store, 'get_risk_analyses', new_callable=AsyncMock) as mock_risks:
            
            mock_rels.return_value = []
            mock_nodes.return_value = []
            mock_risks.return_value = []
            
            result = await store.generate_context_prompt()
            
            assert isinstance(result, str)
            assert "Project Context" in result
            assert "None" in result

    @pytest.mark.asyncio
    async def test_generate_context_prompt_respects_token_limit(self):
        """Test generate_context_prompt truncates when exceeding token limit."""
        store = KnowledgeStore()
        
        # Create large risk data that will exceed token limit
        large_risks = []
        for i in range(100):
            large_risks.append({
                "title": f"Risk {i} with a very long title that contains many words",
                "severity": "High",
                "probability": "Medium",
                "description": "This is a very long description " * 50,
                "mitigation_plan": "This is a very long mitigation plan " * 50
            })
        
        with patch.object(store, 'get_relationship_types', new_callable=AsyncMock) as mock_rels, \
             patch.object(store, 'get_mind_node_types', new_callable=AsyncMock) as mock_nodes, \
             patch.object(store, 'get_risk_analyses', new_callable=AsyncMock) as mock_risks, \
             patch('src.services.knowledge_store.settings') as mock_settings:
            
            mock_rels.return_value = ["CONTAINS"]
            mock_nodes.return_value = ["Project"]
            mock_risks.return_value = large_risks
            mock_settings.ai_max_context_tokens = 500  # Set low limit
            
            result = await store.generate_context_prompt()
            
            # Verify result is within token limit
            token_count = store._estimate_token_count(result)
            assert token_count <= 500
            
            # Verify truncation indicator present
            assert "truncated" in result or "omitted" in result
