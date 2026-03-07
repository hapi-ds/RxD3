"""Unit tests for Mind schemas.

Tests validate all request and response schemas for Mind operations.
"""

from datetime import datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from src.models.enums import StatusEnum
from src.schemas.minds import (
    ErrorResponse,
    MindBulkUpdate,
    MindCreate,
    MindQueryFilters,
    MindResponse,
    MindUpdate,
    QueryResult,
    RelationshipResponse,
)


class TestMindCreate:
    """Test MindCreate schema."""

    def test_valid_mind_create_all_fields(self):
        """Test that valid MindCreate with all fields passes validation."""
        mind = MindCreate(
            mind_type="project",
            title="Test Project",
            description="Test description",
            creator="user@example.com",
            type_specific_attributes={"budget": 50000.0}
        )

        assert mind.mind_type == "project"
        assert mind.title == "Test Project"
        assert mind.creator == "user@example.com"

    def test_valid_mind_create_minimal(self):
        """Test that MindCreate works with minimal fields."""
        mind = MindCreate(
            mind_type="task",
            title="Simple Task",
            creator="user@example.com"
        )

        assert mind.mind_type == "task"
        assert mind.type_specific_attributes == {}  # Empty dict when not provided

    def test_invalid_mind_type(self):
        """Test that invalid mind_type raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            MindCreate(
                mind_type="invalid_type",
                title="Test",
                creator="user@example.com"
            )

        errors = exc_info.value.errors()
        assert any(e["type"] in ("enum", "value_error") for e in errors)

    def test_empty_title(self):
        """Test that empty title raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            MindCreate(
                mind_type="project",
                title="",
                creator="user@example.com"
            )

        errors = exc_info.value.errors()
        assert any(e["type"] == "string_too_short" for e in errors)


class TestMindUpdate:
    """Test MindUpdate schema."""

    def test_valid_mind_update_all_fields(self):
        """Test that valid MindUpdate with all fields passes validation."""
        update = MindUpdate(
            title="Updated Title",
            description="Updated description",
            status=StatusEnum.DONE,
            type_specific_attributes={"budget": 75000.0}
        )

        assert update.title == "Updated Title"
        assert update.status == StatusEnum.DONE

    def test_mind_update_partial_fields(self):
        """Test that MindUpdate works with partial fields."""
        update = MindUpdate(
            title="Partial Update",
            status=StatusEnum.FROZEN
        )

        assert update.title == "Partial Update"

    def test_invalid_status(self):
        """Test that invalid status raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            MindUpdate(status="invalid_status")  # type: ignore[call-arg]

        errors = exc_info.value.errors()
        assert any(e["type"] in ("enum", "value_error") for e in errors)


class TestMindQueryFilters:
    """Test MindQueryFilters schema."""

    def test_valid_query_filters_all_fields(self):
        """Test that valid filters with all fields pass validation."""
        filters = MindQueryFilters(
            mind_type="task",
            status=StatusEnum.DONE,
            creator="user@example.com",
            sort_by="updated_at",
            sort_order="desc",
            page=1,
            page_size=20
        )

        assert filters.mind_type == "task"
        assert filters.status == StatusEnum.DONE

    def test_query_filters_without_mind_type(self):
        """Test that queries work without mind type filter."""
        filters = MindQueryFilters(
            status=StatusEnum.DRAFT,
            creator="user@example.com"
        )

        assert filters.mind_type is None

    def test_invalid_page_size(self):
        """Test that page_size > 100 raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(page_size=101)

        errors = exc_info.value.errors()
        assert any(e["type"] == "less_than_equal" for e in errors)


class TestMindBulkUpdate:
    """Test MindBulkUpdate schema."""

    def test_valid_bulk_update_all_fields(self):
        """Test that valid bulk update passes validation."""
        bulk_update = MindBulkUpdate(
            uuid=uuid4(),
            title="Bulk Updated",
            status=StatusEnum.DONE,
            type_specific_attributes={"priority": "high"}
        )

        assert isinstance(bulk_update.uuid, UUID)
        assert bulk_update.status == StatusEnum.DONE

    def test_bulk_update_partial_fields(self):
        """Test that bulk update works with partial fields."""
        test_uuid = uuid4()
        bulk_update = MindBulkUpdate(
            uuid=test_uuid,
            status=StatusEnum.FROZEN
        )

        assert bulk_update.uuid == test_uuid

    def test_invalid_status_in_bulk(self):
        """Test that invalid status in bulk update raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            MindBulkUpdate(
                uuid=uuid4(),
                status="invalid_status"  # type: ignore[call-arg]
            )

        errors = exc_info.value.errors()
        assert any(e["type"] in ("enum", "value_error") for e in errors)


class TestMindResponse:
    """Test MindResponse schema."""

    def test_valid_mind_response(self):
        """Test that valid MindResponse is created correctly."""
        test_uuid = uuid4()
        response = MindResponse(
            uuid=test_uuid,
            mind_type="project",
            title="Test Project",
            version=1,
            updated_at=datetime(2024, 1, 15, 10, 30, 0),
            creator="user@example.com",
            status=StatusEnum.DONE,
            description="Test description",
            type_specific_attributes={
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "budget": 50000.0
            }
        )

        assert response.uuid == test_uuid
        assert response.mind_type == "project"
        assert response.version == 1

    def test_mind_response_without_description(self):
        """Test that MindResponse works without description."""
        response = MindResponse(
            uuid=uuid4(),
            mind_type="task",
            title="Task Without Description",
            version=1,
            updated_at=datetime.now(),
            creator="user@example.com",
            status=StatusEnum.DONE
        )

        assert response.description is None


class TestQueryResult:
    """Test QueryResult schema."""

    def test_valid_query_result(self):
        """Test that valid QueryResult is created correctly."""
        test_uuid = uuid4()
        mind_response = MindResponse(
            uuid=test_uuid,
            mind_type="project",
            title="Test Project",
            version=1,
            updated_at=datetime.now(),
            creator="user@example.com",
            status=StatusEnum.DONE
        )

        result = QueryResult(
            items=[mind_response],
            total=42,
            page=1,
            page_size=20,
            total_pages=3
        )

        assert len(result.items) == 1
        assert result.total == 42
        assert result.page == 1

    def test_query_result_empty_items(self):
        """Test that QueryResult works with empty items."""
        result = QueryResult(
            items=[],
            total=0,
            page=1,
            page_size=20,
            total_pages=0
        )

        assert len(result.items) == 0


class TestErrorResponse:
    """Test ErrorResponse schema."""

    def test_valid_error_response(self):
        """Test that valid ErrorResponse is created correctly."""
        error = ErrorResponse(
            request_id="req_abc123",
            error_type="ValidationError",
            message="Invalid input data",
            details={"field": "start_date", "error": "start_date must be before end_date"},
            timestamp=datetime(2024, 1, 15, 10, 30, 0)
        )

        assert error.request_id == "req_abc123"
        assert error.error_type == "ValidationError"

    def test_error_response_without_details(self):
        """Test that ErrorResponse works without details."""
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse(
                request_id="req_abc124",
                error_type="NotFoundError",
                message="Resource not found"
            )

        errors = exc_info.value.errors()
        assert any(e["type"] == "missing" for e in errors)


class TestRelationshipResponse:
    """Test RelationshipResponse schema."""

    def test_valid_relationship_response(self):
        """Test that valid relationship response is created correctly."""
        source_uuid = uuid4()
        target_uuid = uuid4()

        relationship = RelationshipResponse(
            relationship_type="contains",
            source_uuid=source_uuid,
            target_uuid=target_uuid,
            created_at=datetime(2024, 1, 15, 10, 30, 0),
            properties={"weight": 1.0, "notes": "Primary dependency"}
        )

        assert relationship.relationship_type == "contains"
        assert relationship.source_uuid == source_uuid
        assert relationship.properties["weight"] == 1.0

    def test_invalid_relationship_type(self):
        """Test that invalid relationship type raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            RelationshipResponse(
                relationship_type="invalid_type",
                source_uuid=uuid4(),
                target_uuid=uuid4(),
                created_at=datetime.now()
            )

        errors = exc_info.value.errors()
        assert any(e["type"] in ("enum", "value_error") for e in errors)
