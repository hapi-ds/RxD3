"""Preservation property tests for _generate_pdf.

These tests verify EXISTING correct behaviors that must be preserved after
the bugfix. They MUST PASS on the current unfixed code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
"""

from datetime import datetime, timezone
from unittest.mock import patch

from hypothesis import given, settings
from hypothesis import strategies as st
from reportlab.platypus import Paragraph, Table


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
# Hypothesis strategies
# ---------------------------------------------------------------------------

# Printable ASCII text safe for ReportLab Paragraph rendering (no XML-special chars)
_safe_text = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Zs"), min_codepoint=32, max_codepoint=126),
    min_size=1,
    max_size=30,
).filter(lambda s: s.strip())

# Reasonable date range for scheduled tasks
_dates = st.datetimes(
    min_value=datetime(2020, 1, 1),
    max_value=datetime(2030, 12, 31),
    timezones=st.just(timezone.utc),
)

_booking = st.fixed_dictionaries({
    "task_title": _safe_text,
    "resource_title": _safe_text,
    "hours": st.floats(min_value=0.1, max_value=1000, allow_nan=False, allow_infinity=False),
    "rate": st.floats(min_value=0.01, max_value=500, allow_nan=False, allow_infinity=False),
})

_journal_entry = st.fixed_dictionaries({
    "created_at": _safe_text,
    "severity": st.sampled_from(["INFO", "WARNING", "ERROR", "DEBUG"]),
    "title": _safe_text,
    "description": _safe_text,
})



# ---------------------------------------------------------------------------
# Property 1 — Cover page preservation
# ---------------------------------------------------------------------------

@given(
    project_title=_safe_text,
    version=st.integers(min_value=1, max_value=9999),
    global_start=_dates,
    global_end=_dates,
)
@settings(max_examples=30, deadline=None)
def test_cover_page_elements_present(project_title, version, global_start, global_end):
    """Cover page contains project title, version, timestamp, and schedule period.

    **Validates: Requirements 3.1**
    """
    # Ensure start <= end
    if global_start > global_end:
        global_start, global_end = global_end, global_start

    elements = _capture_elements(
        project_title=project_title,
        version=version,
        scheduled_tasks=[],
        bookings=[],
        journal_entries=[],
        global_start=global_start,
        global_end=global_end,
    )

    paragraphs = [e for e in elements if isinstance(e, Paragraph)]
    texts = [p.text for p in paragraphs]

    # Project title present (ReportLab strips trailing whitespace from Paragraph text)
    title_stripped = project_title.strip()
    assert any(title_stripped in t for t in texts), (
        f"Project title '{title_stripped}' not found in cover page paragraphs"
    )

    # Schedule version present
    assert any(f"Schedule Version: {version}" in t for t in texts), (
        f"'Schedule Version: {version}' not found in cover page paragraphs"
    )

    # Generated timestamp format present
    assert any("Generated:" in t and "UTC" in t for t in texts), (
        "Generated timestamp not found in cover page paragraphs"
    )

    # Schedule period present with start and end dates
    start_str = global_start.strftime("%Y-%m-%d")
    end_str = global_end.strftime("%Y-%m-%d")
    assert any(
        "Schedule Period:" in t and start_str in t and end_str in t
        for t in texts
    ), (
        f"Schedule Period with {start_str} and {end_str} not found in cover page"
    )


# ---------------------------------------------------------------------------
# Property 2 — Booking row preservation
# ---------------------------------------------------------------------------

@given(bookings=st.lists(_booking, min_size=1, max_size=10))
@settings(max_examples=30, deadline=None)
def test_booking_rows_and_total(bookings):
    """Booking rows contain correct columns and TOTAL row sums hours and cost.

    **Validates: Requirements 3.2**
    """
    elements = _capture_elements(
        project_title="Test",
        version=1,
        scheduled_tasks=[],
        bookings=bookings,
        journal_entries=[],
        global_start=None,
        global_end=None,
    )

    tables = [e for e in elements if isinstance(e, Table)]
    assert tables, "Expected at least one Table for bookings"

    # The booking table is the one with header [Task, Resource, Hours, Rate, Cost]
    booking_table = None
    for tbl in tables:
        header = tbl._cellvalues[0]
        if len(header) == 5 and header[0] == "Task" and header[1] == "Resource":
            booking_table = tbl
            break

    assert booking_table is not None, "Booking table not found"

    data = booking_table._cellvalues

    # Verify individual rows (skip header at 0, skip TOTAL at -1)
    for i, b in enumerate(bookings):
        row = data[i + 1]
        expected_cost = (b["hours"] or 0) * (b["rate"] or 0)
        assert row[0] == b["task_title"]
        assert row[1] == b["resource_title"]
        assert row[2] == f"{b['hours']:.1f}"
        assert row[3] == f"{b['rate']:.2f}"
        assert row[4] == f"{expected_cost:.2f}"

    # Verify TOTAL row
    total_row = data[-1]
    assert total_row[0] == "TOTAL"

    expected_total_hours = sum(b["hours"] or 0 for b in bookings)
    expected_total_cost = sum((b["hours"] or 0) * (b["rate"] or 0) for b in bookings)
    assert total_row[2] == f"{expected_total_hours:.1f}"
    assert total_row[4] == f"{expected_total_cost:.2f}"



# ---------------------------------------------------------------------------
# Property 3 — Journal description preservation
# ---------------------------------------------------------------------------

@given(journal_entries=st.lists(_journal_entry, min_size=1, max_size=10))
@settings(max_examples=30, deadline=None)
def test_journal_descriptions_are_paragraphs(journal_entries):
    """Journal description cells (column index 3) are Paragraph instances.

    **Validates: Requirements 3.3**
    """
    elements = _capture_elements(
        project_title="Test",
        version=1,
        scheduled_tasks=[],
        bookings=[],
        journal_entries=journal_entries,
        global_start=None,
        global_end=None,
    )

    tables = [e for e in elements if isinstance(e, Table)]
    assert tables, "Expected at least one Table for journal entries"

    # The journal table has header [Date, Severity, Title, Description]
    journal_table = None
    for tbl in tables:
        header = tbl._cellvalues[0]
        if len(header) == 4 and header[0] == "Date" and header[3] == "Description":
            journal_table = tbl
            break

    assert journal_table is not None, "Journal table not found"

    data = journal_table._cellvalues
    for row_idx in range(1, len(data)):
        desc_cell = data[row_idx][3]
        assert isinstance(desc_cell, Paragraph), (
            f"Journal description in row {row_idx} is {type(desc_cell).__name__}, "
            f"expected Paragraph"
        )


# ---------------------------------------------------------------------------
# Property 4 — Empty-state preservation
# ---------------------------------------------------------------------------

@given(
    project_title=_safe_text,
    version=st.integers(min_value=1, max_value=9999),
)
@settings(max_examples=20, deadline=None)
def test_empty_state_messages(project_title, version):
    """Empty input lists produce the correct placeholder messages.

    **Validates: Requirements 3.4, 3.5**
    """
    elements = _capture_elements(
        project_title=project_title,
        version=version,
        scheduled_tasks=[],
        bookings=[],
        journal_entries=[],
        global_start=None,
        global_end=None,
    )

    paragraphs = [e for e in elements if isinstance(e, Paragraph)]
    texts = [p.text for p in paragraphs]

    assert any("No scheduled tasks found." in t for t in texts), (
        "Missing 'No scheduled tasks found.' message for empty scheduled_tasks"
    )
    assert any("No bookings recorded." in t for t in texts), (
        "Missing 'No bookings recorded.' message for empty bookings"
    )
    assert any("No journal entries found." in t for t in texts), (
        "Missing 'No journal entries found.' message for empty journal_entries"
    )
