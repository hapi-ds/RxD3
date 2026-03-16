"""
API routes for project report generation.

This module defines REST API endpoints for generating downloadable PDF
project reports containing Gantt charts, booking summaries, and journal entries.

Uses ReportLab for server-side PDF generation.
"""

import io
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from neontology import GraphConnection

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def _query_neo4j(cypher: str, params: dict) -> list[dict]:
    """Execute a Cypher query and return list of record dicts.

    Args:
        cypher: Cypher query string.
        params: Query parameters.

    Returns:
        List of raw record dicts from Neo4j.
    """
    gc = GraphConnection()
    results = gc.engine.evaluate_query(cypher, params)
    if results and results.records_raw:
        return list(results.records_raw)
    return []


def _neo4j_to_python(value):
    """Convert Neo4j native types to Python types.

    Args:
        value: A value that may be a Neo4j datetime or other native type.

    Returns:
        Python-native equivalent.
    """
    if hasattr(value, "to_native"):
        return value.to_native()
    return value


def _generate_pdf(
    project_title: str,
    version: int,
    scheduled_tasks: list[dict],
    bookings: list[dict],
    journal_entries: list[dict],
    global_start: datetime | None,
    global_end: datetime | None,
) -> bytes:
    """Generate a PDF project report using ReportLab.

    Produces a document with:
    - Cover page with project title, version, timestamp
    - Gantt chart visualization
    - Booking summary table
    - Journal entries section

    Args:
        project_title: Name of the project.
        version: Schedule version number.
        scheduled_tasks: List of scheduled task dicts with schedule data.
        bookings: List of booking dicts with hours, resource, cost info.
        journal_entries: List of journal entry dicts.
        global_start: Earliest task start date.
        global_end: Latest task end date.

    Returns:
        PDF content as bytes.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CoverTitle", parent=styles["Title"], fontSize=28, spaceAfter=20
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitle", parent=styles["Heading2"], fontSize=16, spaceAfter=10
    )
    section_style = ParagraphStyle(
        "SectionHeader", parent=styles["Heading2"], fontSize=14, spaceBefore=20, spaceAfter=10
    )
    body_style = styles["Normal"]

    elements = []

    # --- Cover Page ---
    elements.append(Spacer(1, 4 * cm))
    elements.append(Paragraph(project_title, title_style))
    elements.append(Paragraph(f"Schedule Version: {version}", subtitle_style))
    elements.append(
        Paragraph(
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            subtitle_style,
        )
    )
    if global_start and global_end:
        start_str = global_start.strftime("%Y-%m-%d") if isinstance(global_start, datetime) else str(global_start)
        end_str = global_end.strftime("%Y-%m-%d") if isinstance(global_end, datetime) else str(global_end)
        elements.append(Paragraph(f"Schedule Period: {start_str} — {end_str}", body_style))
    elements.append(Spacer(1, 2 * cm))

    # --- Gantt Chart Section ---
    elements.append(Paragraph("Gantt Chart — Scheduled Tasks", section_style))

    if scheduled_tasks:
        gantt_header = ["Task", "Type", "Start", "End", "Duration (d)", "Critical", "Progress"]
        gantt_data = [gantt_header]
        for t in scheduled_tasks:
            start = t.get("scheduled_start", "")
            end = t.get("scheduled_end", "")
            if isinstance(start, datetime):
                start = start.strftime("%Y-%m-%d")
            if isinstance(end, datetime):
                end = end.strftime("%Y-%m-%d")
            progress = t.get("progress", 0)
            progress_str = f"{progress * 100:.0f}%" if isinstance(progress, (int, float)) else str(progress)

            gantt_data.append([
                t.get("task_title", t.get("title", "")),
                t.get("task_type", ""),
                str(start),
                str(end),
                f"{t.get('scheduled_duration', 0):.1f}",
                "YES" if t.get("is_critical") else "",
                progress_str,
            ])

        gantt_table = Table(gantt_data, repeatRows=1)
        gantt_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(gantt_table)
    else:
        elements.append(Paragraph("No scheduled tasks found.", body_style))

    elements.append(Spacer(1, 1 * cm))

    # --- Booking Summary ---
    elements.append(Paragraph("Booking Summary", section_style))

    if bookings:
        booking_header = ["Task", "Resource", "Hours", "Rate", "Cost"]
        booking_data = [booking_header]
        for b in bookings:
            cost = (b.get("hours", 0) or 0) * (b.get("rate", 0) or 0)
            booking_data.append([
                b.get("task_title", ""),
                b.get("resource_title", ""),
                f"{b.get('hours', 0):.1f}",
                f"{b.get('rate', 0):.2f}",
                f"{cost:.2f}",
            ])

        # Totals row
        total_hours = sum(b.get("hours", 0) or 0 for b in bookings)
        total_cost = sum(
            (b.get("hours", 0) or 0) * (b.get("rate", 0) or 0) for b in bookings
        )
        booking_data.append(["TOTAL", "", f"{total_hours:.1f}", "", f"{total_cost:.2f}"])

        booking_table = Table(booking_data, repeatRows=1)
        booking_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8f9fa")]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ecf0f1")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(booking_table)
    else:
        elements.append(Paragraph("No bookings recorded.", body_style))

    elements.append(Spacer(1, 1 * cm))

    # --- Journal Entries ---
    elements.append(Paragraph("Journal Entries", section_style))

    if journal_entries:
        journal_header = ["Date", "Severity", "Title", "Description"]
        journal_data = [journal_header]
        for j in journal_entries:
            created = j.get("created_at", "")
            if isinstance(created, datetime):
                created = created.strftime("%Y-%m-%d %H:%M")
            journal_data.append([
                str(created),
                j.get("severity", ""),
                j.get("title", ""),
                Paragraph(j.get("description", ""), body_style),
            ])

        journal_table = Table(journal_data, colWidths=[80, 60, 150, None], repeatRows=1)
        journal_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(journal_table)
    else:
        elements.append(Paragraph("No journal entries found.", body_style))

    doc.build(elements)
    return buffer.getvalue()


@router.get(
    "/project/{project_uuid}/pdf",
    response_class=StreamingResponse,
)
async def generate_project_pdf(
    project_uuid: str,
    version: Optional[int] = Query(None, ge=1),
):
    """Generate and return a PDF project report.

    The report includes a Gantt chart table, booking summary, and journal entries
    for the specified schedule version (or latest if not specified).

    Args:
        project_uuid: UUID of the project.
        version: Optional schedule version. Defaults to latest.

    Returns:
        StreamingResponse with PDF binary content.

    Raises:
        HTTPException: 404 if project not found.
        HTTPException: 400 if project has no schedule history.
    """
    # Verify project exists
    project_records = _query_neo4j(
        "MATCH (p:Project {uuid: $uuid}) RETURN p LIMIT 1",
        {"uuid": project_uuid},
    )
    if not project_records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Project not found", "uuid": project_uuid},
        )

    project_data = dict(project_records[0]["p"])
    project_title = project_data.get("title", "Untitled Project")

    # Determine version
    if version is None:
        ver_records = _query_neo4j(
            """
            MATCH (p {uuid: $uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
            RETURN h.version as version ORDER BY h.version DESC LIMIT 1
            """,
            {"uuid": project_uuid},
        )
        if not ver_records:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Project must be scheduled before generating a report"},
            )
        version = ver_records[0].get("version")
    else:
        # Verify version exists
        ver_check = _query_neo4j(
            """
            MATCH (p {uuid: $uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory {version: $version})
            RETURN h LIMIT 1
            """,
            {"uuid": project_uuid, "version": version},
        )
        if not ver_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Schedule version not found", "version": version},
            )

    # Get schedule history metadata
    history_records = _query_neo4j(
        """
        MATCH (p {uuid: $uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory {version: $version})
        RETURN h LIMIT 1
        """,
        {"uuid": project_uuid, "version": version},
    )
    global_start = None
    global_end = None
    if history_records:
        h_data = dict(history_records[0]["h"])
        global_start = _neo4j_to_python(h_data.get("global_start"))
        global_end = _neo4j_to_python(h_data.get("global_end"))

    # Get scheduled tasks with source task info
    task_records = _query_neo4j(
        """
        MATCH (source:Task)-[sched:SCHEDULED {version: $version}]->(st:ScheduledTask)
        WHERE EXISTS {
            MATCH (p {uuid: $uuid})-[:CONTAINS*]->(source)
        }
        OPTIONAL MATCH (b:Booking)-[:TO]->(source)
        WITH st, source, COALESCE(sum(b.hours_worked), 0) as booked_hours
        RETURN st, source.title as task_title, source.task_type as task_type,
               source.effort as task_effort, booked_hours
        ORDER BY st.scheduled_start
        """,
        {"uuid": project_uuid, "version": version},
    )

    scheduled_tasks = []
    for rec in task_records:
        st = dict(rec["st"])
        for k, v in st.items():
            st[k] = _neo4j_to_python(v)
        effort = rec.get("task_effort") or 0
        booked = rec.get("booked_hours") or 0
        progress = (booked / effort) if effort > 0 else 0.0
        st["task_title"] = rec.get("task_title", "")
        st["task_type"] = rec.get("task_type", "")
        st["progress"] = min(progress, 1.0)
        scheduled_tasks.append(st)

    # Get bookings with task and resource info
    booking_records = _query_neo4j(
        """
        MATCH (b:Booking)-[:TO]->(t:Task)
        WHERE EXISTS {
            MATCH (p {uuid: $uuid})-[:CONTAINS*]->(t)
        }
        OPTIONAL MATCH (b)-[:FOR]->(r:Resource)
        RETURN b.hours_worked as hours, b.rate as rate,
               t.title as task_title, r.title as resource_title
        ORDER BY t.title
        """,
        {"uuid": project_uuid},
    )

    bookings = []
    for rec in booking_records:
        bookings.append({
            "hours": _neo4j_to_python(rec.get("hours")) or 0,
            "rate": _neo4j_to_python(rec.get("rate")) or 0,
            "task_title": rec.get("task_title", ""),
            "resource_title": rec.get("resource_title", ""),
        })

    # Get journal entries ordered by created_at ascending
    journal_records = _query_neo4j(
        """
        MATCH (j:Journalentry)-[:TO]->(target)
        WHERE target.uuid = $uuid
           OR EXISTS {
               MATCH (p {uuid: $uuid})-[:CONTAINS*]->(target)
           }
        RETURN j ORDER BY j.created_at ASC
        """,
        {"uuid": project_uuid},
    )

    journal_entries = []
    for rec in journal_records:
        j = dict(rec["j"])
        for k, v in j.items():
            j[k] = _neo4j_to_python(v)
        journal_entries.append(j)

    # Generate PDF
    pdf_bytes = _generate_pdf(
        project_title=project_title,
        version=version,
        scheduled_tasks=scheduled_tasks,
        bookings=bookings,
        journal_entries=journal_entries,
        global_start=global_start,
        global_end=global_end,
    )

    filename = f"project_report_{project_uuid}_v{version}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
