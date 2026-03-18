"""Bug condition exploration tests for FailureCreate schema.

These tests encode the EXPECTED behavior — they will FAIL on unfixed code,
confirming the bug exists (FailureCreate lacks ge=1, le=10 constraints).

**Validates: Requirements 1.3, 2.3**
"""

import pytest
from pydantic import ValidationError

from src.schemas.minds import FailureCreate


class TestFailureCreateMissingConstraints:
    """Bug condition: FailureCreate accepts out-of-range occurrence/detectability.

    The FailureCreate schema should reject values outside 1-10, but currently
    it accepts any integer because ge/le constraints are not propagated from
    the Failure model to the auto-generated schema.
    """

    def test_occurrence_zero_should_raise_validation_error(self) -> None:
        """occurrence=0 is below the valid range 1-10 and should be rejected.

        **Validates: Requirements 1.3, 2.3**
        """
        with pytest.raises(ValidationError):
            FailureCreate(title="Test", creator="user1", occurrence=0)

    def test_detectability_eleven_should_raise_validation_error(self) -> None:
        """detectability=11 is above the valid range 1-10 and should be rejected.

        **Validates: Requirements 1.3, 2.3**
        """
        with pytest.raises(ValidationError):
            FailureCreate(title="Test", creator="user1", detectability=11)

    def test_occurrence_negative_should_raise_validation_error(self) -> None:
        """occurrence=-5 is below the valid range 1-10 and should be rejected.

        **Validates: Requirements 1.3, 2.3**
        """
        with pytest.raises(ValidationError):
            FailureCreate(title="Test", creator="user1", occurrence=-5)
