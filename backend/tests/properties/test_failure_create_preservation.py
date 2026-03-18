"""Preservation property tests for FailureCreate schema.

These tests capture the CURRENT behavior of FailureCreate on UNFIXED code
for non-buggy inputs. They must PASS on unfixed code, confirming baseline
behavior that the fix must preserve.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**
"""

from hypothesis import given, settings
from hypothesis.strategies import integers, none, one_of

from src.schemas.minds import FailureCreate


class TestFailureCreateValidValuesPreservation:
    """Preservation: valid occurrence/detectability values in [1..10] are accepted.

    **Validates: Requirements 3.3, 3.4**
    """

    @given(
        occurrence=integers(min_value=1, max_value=10),
        detectability=integers(min_value=1, max_value=10),
    )
    @settings(max_examples=50)
    def test_valid_occurrence_and_detectability_accepted(
        self, occurrence: int, detectability: int
    ) -> None:
        """For all occurrence in [1..10] and detectability in [1..10],
        FailureCreate accepts the payload.

        **Validates: Requirements 3.3**
        """
        result = FailureCreate(
            title="Test",
            creator="user1",
            occurrence=occurrence,
            detectability=detectability,
        )
        assert result.occurrence == occurrence
        assert result.detectability == detectability

    @given(
        occurrence=one_of(none(), integers(min_value=1, max_value=10)),
        detectability=one_of(none(), integers(min_value=1, max_value=10)),
    )
    @settings(max_examples=50)
    def test_null_occurrence_and_detectability_accepted(
        self, occurrence: int | None, detectability: int | None
    ) -> None:
        """For all valid FailureCreate payloads with occurrence=None and/or
        detectability=None, schema accepts them.

        **Validates: Requirements 3.4**
        """
        result = FailureCreate(
            title="Test",
            creator="user1",
            occurrence=occurrence,
            detectability=detectability,
        )
        assert result.occurrence == occurrence
        assert result.detectability == detectability
