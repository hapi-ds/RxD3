"""Bug condition exploration tests for _generate_pdf.

These tests MUST FAIL on the current unfixed code to confirm the three bugs exist:
1. Gantt chart renders as a plain Table instead of a Drawing with visual bars.
2. Booking summary omits expected project costs from scheduled tasks' total_cost.
3. Journal date strings are plain str instead of Paragraph objects.

**Validates: Requirements 1.1, 1.2, 1.3**
"""

from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from reportlab.graphics.shapes import Drawing
from reportlab.platypus import Paragraph


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _capture_elements(**kwargs):
    """Call _generate_pdf while intercepting the elements list passed to doc.build."""
    from src.routes.reports import _generate_pdf

    captured = {}

    def _fake_build(self, elems, **kw):
        captured["elements"] = list(elems)

    with patch("reportlab.platypus.SimpleDocTemplate.build", _fake_build):
        _generate_pdf(**kwargs)

    return captured["elements"]


# ---------------------------------------------------------------------------
# Shared test data factories
# ---------------------------------------------------------------------------

def _make_scheduled_tasks():
    """Return 3 scheduled tasks: critical, standard, milestone."""
    return [
        {
            "task_title": "Foundation",
            "task_type": "STANDARD",
            "scheduled_start": datetime(2025, 1, 1, tzinfo=timezone.utc),
            "scheduled_end": datetime(2025, 1, 15, tzinfo=timezone.utc),
            "scheduled_duration": 14,
            "is_critical": True,
            "progress": 0.6,
            "total_cost": 1200,
        },
        {
            "task_title": "Framing",
            "task_type": "STANDARD",
            "scheduled_start": datetime(2025, 1, 10, tzinfo=timezone.utc),
            "scheduled_end": datetime(2025, 1, 25, tzinfo=timezone.utc),
            "scheduled_duration": 15,
            "is_critical": False,
            "progress": 0.3,
            "total_cost": 800,
        },
        {
            "task_title": "Inspection",
            "task_type": "MILESTONE",
            "scheduled_start": datetime(2025, 1, 25, tzinfo=timezone.utc),
            "scheduled_end": datetime(2025, 1, 25, tzinfo=timezone.utc),
            "scheduled_duration": 0,
            "is_critical": False,
            "progress": 0.0,
            "total_cost": 500,
        },
    ]


def _make_bookings():
    """Return sample bookings."""
    return [
        {"task_title": "Foundation", "resource_title": "Alice", "hours": 40, "rate": 50},
        {"task_title": "Framing", "resource_title": "Bob", "hours": 20, "rate": 60},
    ]


def _make_journal_entries():
    """Return journal entries with datetime-formatted strings."""
    return [
        {
            "created_at": "2025-01-15 14:30",
            "severity": "INFO",
            "title": "Progress update",
            "description": "Foundation work is on track.",
        },
        {
            "created_at": "2025-01-20 09:00",
            "severity": "WARNING",
            "title": "Delay risk",
            "description": "Material delivery delayed by 2 days.",
        },
    ]


# ---------------------------------------------------------------------------
# Test 1 — Gantt chart should be a Drawing, not a Table
# ---------------------------------------------------------------------------

def test_gantt_renders_drawing_not_table():
    """Gantt section must contain a Drawing flowable with visual bars.

    On unfixed code this FAILS because the Gantt section produces a plain Table.
    """
    elements = _capture_elements(
        project_title="Test Project",
        version=1,
        scheduled_tasks=_make_scheduled_tasks(),
        bookings=[],
        journal_entries=[],
        global_start=datetime(2025, 1, 1, tzinfo=timezone.utc),
        global_end=datetime(2025, 1, 31, tzinfo=timezone.utc),
    )

    drawings = [e for e in elements if isinstance(e, Drawing)]
    assert len(drawings) >= 1, (
        f"Expected at least one Drawing flowable for the Gantt chart, "
        f"but found none. Element types: {[type(e).__name__ for e in elements]}"
    )


# ---------------------------------------------------------------------------
# Test 2 — Booking summary should include expected project costs
# ---------------------------------------------------------------------------

def test_booking_summary_includes_expected_project_costs():
    """Booking section must show 'Expected Project Costs' with sum of total_cost.

    On unfixed code this FAILS because total_cost is never aggregated.
    """
    tasks = _make_scheduled_tasks()
    expected_total = sum(t.get("total_cost", 0) or 0 for t in tasks)  # 2500

    elements = _capture_elements(
        project_title="Test Project",
        version=1,
        scheduled_tasks=tasks,
        bookings=_make_bookings(),
        journal_entries=[],
        global_start=datetime(2025, 1, 1, tzinfo=timezone.utc),
        global_end=datetime(2025, 1, 31, tzinfo=timezone.utc),
    )

    # Collect all text content from Paragraph elements
    text_content = ""
    for e in elements:
        if isinstance(e, Paragraph):
            text_content += e.text + " "

    assert "Expected Project Costs" in text_content, (
        f"Expected 'Expected Project Costs' label in PDF content but not found. "
        f"Paragraph texts: {[e.text for e in elements if isinstance(e, Paragraph)]}"
    )
    assert str(f"{expected_total:.2f}") in text_content or str(expected_total) in text_content, (
        f"Expected total cost {expected_total} in PDF content but not found."
    )


# ---------------------------------------------------------------------------
# Test 3 — Journal date cells should be Paragraph, not plain str
# ---------------------------------------------------------------------------

def test_journal_dates_are_paragraphs():
    """Journal date cells must be Paragraph instances for proper text wrapping.

    On unfixed code this FAILS because dates are inserted as plain strings.
    """
    from reportlab.platypus import Table

    elements = _capture_elements(
        project_title="Test Project",
        version=1,
        scheduled_tasks=[],
        bookings=[],
        journal_entries=_make_journal_entries(),
        global_start=None,
        global_end=None,
    )

    # Find the journal table — it's the last Table in the elements list
    tables = [e for e in elements if isinstance(e, Table)]
    assert tables, "Expected at least one Table for journal entries"

    journal_table = tables[-1]
    # Access the underlying data rows (skip header row at index 0)
    table_data = journal_table._cellvalues

    for row_idx in range(1, len(table_data)):
        date_cell = table_data[row_idx][0]  # first column is the date
        assert isinstance(date_cell, Paragraph), (
            f"Journal date cell in row {row_idx} is {type(date_cell).__name__} "
            f"(value: {date_cell!r}), expected Paragraph"
        )
