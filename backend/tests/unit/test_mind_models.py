"""Unit tests for Mind models.

Tests validate the BaseMind model and its derived types.
"""

import pytest
from pydantic import ValidationError

from src.models.enums import StatusEnum
from src.models.mind import BaseMind


class TestBaseMind:
    """Test BaseMind model validation."""

    def test_valid_mind_creation(self):
        """Test that a valid Mind node can be created."""
        mind = BaseMind(
            title="Test Mind",
            creator="test@example.com"
        )

        assert mind.title == "Test Mind"
        assert mind.creator == "test@example.com"
        assert mind.version == 1
        assert mind.status == StatusEnum.DRAFT

    def test_mind_with_description(self):
        """Test that a Mind node can be created with description."""
        mind = BaseMind(
            title="Test Mind",
            creator="test@example.com",
            description="Test description"
        )

        assert mind.description == "Test description"

    def test_mind_empty_title_raises_error(self):
        """Test that empty title raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            BaseMind(
                title="",
                creator="test@example.com"
            )

        errors = exc_info.value.errors()
        assert any(e["type"] == "string_too_short" for e in errors)

    def test_mind_long_title_raises_error(self):
        """Test that title exceeding max length raises ValidationError."""
        long_title = "x" * 201

        with pytest.raises(ValidationError) as exc_info:
            BaseMind(
                title=long_title,
                creator="test@example.com"
            )

        errors = exc_info.value.errors()
        assert any(e["type"] == "string_too_long" for e in errors)

    def test_mind_invalid_status_raises_error(self):
        """Test that invalid status raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            BaseMind(
                title="Test Mind",
                creator="test@example.com",
                status="invalid_status"  # type: ignore[call-arg]
            )

        errors = exc_info.value.errors()
        assert any(e["type"] == "enum" for e in errors)

    def test_mind_all_fields(self):
        """Test that a Mind node can be created with all fields."""
        mind = BaseMind(
            title="Complete Mind",
            creator="creator@example.com",
            description="Full description",
            status=StatusEnum.DONE
        )

        assert mind.title == "Complete Mind"
        assert mind.creator == "creator@example.com"
        assert mind.description == "Full description"
        assert mind.status == StatusEnum.DONE
