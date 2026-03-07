"""Unit tests for Mind system enumeration types.

Tests validate that all enum types are correctly defined with expected values
and can be used for validation in Pydantic models.

**Validates: Requirements 1.6, 9.2, 9.4**
"""

import pytest
from pydantic import BaseModel, ValidationError

from src.models.enums import (
    PriorityEnum,
    ProbabilityEnum,
    SeverityEnum,
    StatusEnum,
)


class TestStatusEnum:
    """Test StatusEnum definition and validation."""

    def test_status_enum_values(self):
        """
        Test that StatusEnum has all required values.
        Validates Requirement 1.6.
        """
        assert StatusEnum.DRAFT.value == "draft"
        assert StatusEnum.FROZEN.value == "frozen"
        assert StatusEnum.ACCEPTED.value == "accepted"
        assert StatusEnum.READY.value == "ready"
        assert StatusEnum.DONE.value == "done"
        assert StatusEnum.ARCHIVED.value == "archived"
        assert StatusEnum.OBSOLET.value == "obsolet"

    def test_status_enum_count(self):
        """Test that StatusEnum has exactly 7 values."""
        assert len(StatusEnum) == 7

    def test_status_enum_in_pydantic_model(self):
        """Test that StatusEnum can be used in Pydantic models for validation."""

        class TestModel(BaseModel):
            status: StatusEnum

        # Valid status values should work
        valid_model = TestModel(status="draft")  # type: ignore[call-arg]
        assert valid_model.status == StatusEnum.DRAFT

        valid_model = TestModel(status=StatusEnum.DONE)
        assert valid_model.status == StatusEnum.DONE

        # Invalid status values should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            TestModel(status="invalid_status")  # type: ignore[call-arg]

        error = exc_info.value.errors()[0]
        assert error["type"] == "enum"


class TestPriorityEnum:
    """Test PriorityEnum definition and validation."""

    def test_priority_enum_values(self):
        """
        Test that PriorityEnum has all required values.
        Validates Requirement 9.2.
        """
        assert PriorityEnum.LOW.value == "low"
        assert PriorityEnum.MEDIUM.value == "medium"
        assert PriorityEnum.HIGH.value == "high"
        assert PriorityEnum.CRITICAL.value == "critical"

    def test_priority_enum_count(self):
        """Test that PriorityEnum has exactly 4 values."""
        assert len(PriorityEnum) == 4

    def test_priority_enum_in_pydantic_model(self):
        """Test that PriorityEnum can be used in Pydantic models for validation."""

        class TestModel(BaseModel):
            priority: PriorityEnum

        # Valid priority values should work
        valid_model = TestModel(priority="high")  # type: ignore[call-arg]
        assert valid_model.priority == PriorityEnum.HIGH

        valid_model = TestModel(priority=PriorityEnum.CRITICAL)
        assert valid_model.priority == PriorityEnum.CRITICAL

        # Invalid priority values should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            TestModel(priority="urgent")  # type: ignore[call-arg]

        error = exc_info.value.errors()[0]
        assert error["type"] == "enum"


class TestSeverityEnum:
    """Test SeverityEnum definition and validation."""

    def test_severity_enum_values(self):
        """
        Test that SeverityEnum has all required values.
        Validates Requirement 9.4.
        """
        assert SeverityEnum.LOW.value == "low"
        assert SeverityEnum.MEDIUM.value == "medium"
        assert SeverityEnum.HIGH.value == "high"
        assert SeverityEnum.CRITICAL.value == "critical"

    def test_severity_enum_count(self):
        """Test that SeverityEnum has exactly 4 values."""
        assert len(SeverityEnum) == 4

    def test_severity_enum_in_pydantic_model(self):
        """Test that SeverityEnum can be used in Pydantic models for validation."""

        class TestModel(BaseModel):
            severity: SeverityEnum

        # Valid severity values should work
        valid_model = TestModel(severity="medium")  # type: ignore[call-arg]
        assert valid_model.severity == SeverityEnum.MEDIUM

        valid_model = TestModel(severity=SeverityEnum.CRITICAL)
        assert valid_model.severity == SeverityEnum.CRITICAL

        # Invalid severity values should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            TestModel(severity="extreme")  # type: ignore[call-arg]

        error = exc_info.value.errors()[0]
        assert error["type"] == "enum"


class TestProbabilityEnum:
    """Test ProbabilityEnum definition and validation."""

    def test_probability_enum_values(self):
        """
        Test that ProbabilityEnum has all required values.
        Validates Requirement 9.4.
        """
        assert ProbabilityEnum.RARE.value == "rare"
        assert ProbabilityEnum.UNLIKELY.value == "unlikely"
        assert ProbabilityEnum.POSSIBLE.value == "possible"
        assert ProbabilityEnum.LIKELY.value == "likely"
        assert ProbabilityEnum.CERTAIN.value == "certain"

    def test_probability_enum_count(self):
        """Test that ProbabilityEnum has exactly 5 values."""
        assert len(ProbabilityEnum) == 5

    def test_probability_enum_in_pydantic_model(self):
        """Test that ProbabilityEnum can be used in Pydantic models for validation."""

        class TestModel(BaseModel):
            probability: ProbabilityEnum

        # Valid probability values should work
        valid_model = TestModel(probability="likely")  # type: ignore[call-arg]
        assert valid_model.probability == ProbabilityEnum.LIKELY

        valid_model = TestModel(probability=ProbabilityEnum.CERTAIN)
        assert valid_model.probability == ProbabilityEnum.CERTAIN

        # Invalid probability values should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            TestModel(probability="maybe")  # type: ignore[call-arg]

        error = exc_info.value.errors()[0]
        assert error["type"] == "enum"
