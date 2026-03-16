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


def _to_datetime(value) -> datetime | None:
    """Coerce a date-like value to a timezone-aware datetime, or None.

    Handles datetime, date, and ISO-format strings from Neo4j.

    Args:
        value: A datetime, date, or string value.

    Returns:
        A timezone-aware datetime or None if conversion fails.
    """
    from datetime import date
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)
    if isinstance(value, str) and value:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            return None
    return None


def _generate_pdf(
    project_title: str,
    version: int,
    scheduled_tasks: list[dict],
    bookings: list[dict],
    journal_entries: list[dict],
    global_start: datetime | None,
    global_end: datetime | None,
    time_scale: str = "months",
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
        time_scale: Gantt time scale — 'weeks', 'months', 'quarters', or 'years'.

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

    # Compute dynamic page size: wide enough for Gantt table+bars, tall enough for rows.
    base_width, base_height = landscape(A4)  # 841 x 595
    ROW_HEIGHT = 32
    HEADER_HEIGHT = 40

    # Pixels-per-day matching the UI GanttChart.tsx getPxPerDay()
    _scale_px = {"weeks": 30, "months": 10, "quarters": 4, "years": 1.5}
    PX_PER_DAY = _scale_px.get(time_scale, 10)

    # Gantt width: table(290) + gap(4) + bars(total_days * px/day)
    if scheduled_tasks:
        _task_starts = [d for t in scheduled_tasks if (d := _to_datetime(t.get("scheduled_start"))) is not None]
        _task_ends = [d for t in scheduled_tasks if (d := _to_datetime(t.get("scheduled_end"))) is not None]
        _gs = _to_datetime(global_start) or (min(_task_starts) if _task_starts else datetime(2025, 1, 1, tzinfo=timezone.utc))
        _ge = _to_datetime(global_end) or (max(_task_ends) if _task_ends else _gs)
        _total_days = max(1, (_ge - _gs).days + 7)
        gantt_width = 290 + 4 + _total_days * PX_PER_DAY  # table + gap + bars
        gantt_height = HEADER_HEIGHT + len(scheduled_tasks) * ROW_HEIGHT
    else:
        gantt_width = 0
        gantt_height = 0

    # Page width: fit the Gantt drawing + margins
    page_width = max(base_width, gantt_width + 3 * cm)
    # Page height: fit the Gantt drawing + margins + space for other sections
    min_frame_height = base_height - 3 * cm
    needed_frame_height = max(min_frame_height, gantt_height + 2 * cm)
    page_height = needed_frame_height + 3 * cm

    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, page_height),
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
        _gs_cover = _to_datetime(global_start)
        _ge_cover = _to_datetime(global_end)
        if _gs_cover and _ge_cover:
            start_str = _gs_cover.strftime("%Y-%m-%d")
            end_str = _ge_cover.strftime("%Y-%m-%d")
            elements.append(Paragraph(f"Schedule Period: {start_str} — {end_str}", body_style))
    elements.append(Spacer(1, 2 * cm))

    # --- Gantt Chart Section ---
    elements.append(Paragraph("Gantt Chart — Scheduled Tasks", section_style))

    if scheduled_tasks:
        from reportlab.graphics.shapes import Drawing, Rect, Line, String, Polygon
        from reportlab.lib.colors import HexColor

        # --- Layout constants matching UI TaskListTable + GanttChart ---
        # Left table columns: ID(30) + Task(150) + Duration(55) + Type(55) = 290
        COL_ID_W = 30
        COL_TASK_W = 150
        COL_DUR_W = 55
        COL_TYPE_W = 55
        TABLE_WIDTH = COL_ID_W + COL_TASK_W + COL_DUR_W + COL_TYPE_W
        TABLE_GAP = 4  # gap between table and bars

        # Compute date range
        task_starts = []
        task_ends = []
        for t in scheduled_tasks:
            ts = _to_datetime(t.get("scheduled_start"))
            te = _to_datetime(t.get("scheduled_end"))
            if ts:
                task_starts.append(ts)
            if te:
                task_ends.append(te)

        g_start = _to_datetime(global_start) or (min(task_starts) if task_starts else datetime(2025, 1, 1, tzinfo=timezone.utc))
        g_end = _to_datetime(global_end) or (max(task_ends) if task_ends else g_start)

        total_days = max(1, (g_end - g_start).days + 7)
        bar_area_width = total_days * PX_PER_DAY

        drawing_width = TABLE_WIDTH + TABLE_GAP + bar_area_width
        drawing_height = HEADER_HEIGHT + len(scheduled_tasks) * ROW_HEIGHT

        d = Drawing(drawing_width, drawing_height)

        # --- Table header band (left) ---
        header_y = drawing_height - HEADER_HEIGHT
        d.add(Rect(0, header_y, TABLE_WIDTH, HEADER_HEIGHT, fillColor=HexColor("#2c3e50"), strokeColor=None))
        # Column headers
        col_headers = [
            (COL_ID_W / 2, "ID"),
            (COL_ID_W + COL_TASK_W / 2, "Task"),
            (COL_ID_W + COL_TASK_W + COL_DUR_W / 2, "Duration"),
            (COL_ID_W + COL_TASK_W + COL_DUR_W + COL_TYPE_W / 2, "Type"),
        ]
        for cx, label in col_headers:
            d.add(String(cx, header_y + HEADER_HEIGHT / 2 - 4, label, fontSize=8, fillColor=HexColor("#ffffff"), textAnchor="middle"))

        # --- Timeline header band (right) ---
        bar_origin_x = TABLE_WIDTH + TABLE_GAP
        d.add(Rect(bar_origin_x, header_y, bar_area_width, HEADER_HEIGHT, fillColor=HexColor("#2c3e50"), strokeColor=None))

        # Date labels in timeline header — matching UI getDateLabels()
        cursor = datetime(g_start.year, g_start.month, 1, tzinfo=g_start.tzinfo)
        if time_scale == "weeks":
            # Start from the Monday of the week containing g_start
            cursor = g_start - __import__("datetime").timedelta(days=g_start.weekday())
        elif time_scale == "quarters":
            q_month = ((g_start.month - 1) // 3) * 3 + 1
            cursor = datetime(g_start.year, q_month, 1, tzinfo=g_start.tzinfo)
        elif time_scale == "years":
            cursor = datetime(g_start.year, 1, 1, tzinfo=g_start.tzinfo)

        while cursor <= g_end:
            day_offset = max(0, (cursor - g_start).days)
            label_x = bar_origin_x + day_offset * PX_PER_DAY

            if time_scale == "weeks":
                label_text = cursor.strftime("%b %d")
                next_cursor = cursor + __import__("datetime").timedelta(days=7)
            elif time_scale == "months":
                label_text = cursor.strftime("%b %Y")
                if cursor.month == 12:
                    next_cursor = datetime(cursor.year + 1, 1, 1, tzinfo=cursor.tzinfo)
                else:
                    next_cursor = datetime(cursor.year, cursor.month + 1, 1, tzinfo=cursor.tzinfo)
            elif time_scale == "quarters":
                q = (cursor.month - 1) // 3 + 1
                label_text = f"Q{q} {cursor.year}"
                nm = cursor.month + 3
                ny = cursor.year + (nm - 1) // 12
                nm = ((nm - 1) % 12) + 1
                next_cursor = datetime(ny, nm, 1, tzinfo=cursor.tzinfo)
            else:  # years
                label_text = str(cursor.year)
                next_cursor = datetime(cursor.year + 1, 1, 1, tzinfo=cursor.tzinfo)

            if label_x < drawing_width:
                d.add(String(label_x + 2, header_y + HEADER_HEIGHT / 2 - 4, label_text, fontSize=7, fillColor=HexColor("#ffffff")))
                d.add(Line(label_x, header_y, label_x, 0, strokeColor=HexColor("#dddddd"), strokeWidth=0.5))

            cursor = next_cursor

        # --- Task rows ---
        for idx, t in enumerate(scheduled_tasks):
            row_y = drawing_height - HEADER_HEIGHT - (idx + 1) * ROW_HEIGHT
            bar_y = row_y + ROW_HEIGHT * 0.2
            bar_h = ROW_HEIGHT * 0.6

            # Alternating row background
            if idx % 2 == 1:
                d.add(Rect(0, row_y, drawing_width, ROW_HEIGHT, fillColor=HexColor("#f8f9fa"), strokeColor=None))

            # Horizontal row separator
            d.add(Line(0, row_y, drawing_width, row_y, strokeColor=HexColor("#eeeeee"), strokeWidth=0.5))

            task_name = t.get("task_title", t.get("title", ""))
            task_type = t.get("task_type", "")
            t_duration = t.get("scheduled_duration", 0) or 0
            is_critical = t.get("is_critical", False)
            progress = t.get("progress", 0) or 0
            text_color = HexColor("#e74c3c") if is_critical else HexColor("#333333")

            # ID column
            d.add(String(COL_ID_W / 2, row_y + ROW_HEIGHT / 2 - 4, str(idx + 1), fontSize=7, fillColor=text_color, textAnchor="middle"))

            # Task name column (truncate to fit)
            max_chars = int(COL_TASK_W / 4.5)
            display_name = task_name[:max_chars - 3] + "..." if len(task_name) > max_chars else task_name
            d.add(String(COL_ID_W + 4, row_y + ROW_HEIGHT / 2 - 4, display_name, fontSize=7, fillColor=text_color))

            # Duration column
            dur_str = f"{t_duration:.1f}d"
            d.add(String(COL_ID_W + COL_TASK_W + COL_DUR_W / 2, row_y + ROW_HEIGHT / 2 - 4, dur_str, fontSize=7, fillColor=text_color, textAnchor="middle"))

            # Type column
            d.add(String(COL_ID_W + COL_TASK_W + COL_DUR_W + COL_TYPE_W / 2, row_y + ROW_HEIGHT / 2 - 4, task_type, fontSize=7, fillColor=text_color, textAnchor="middle"))

            # --- Bar in timeline area ---
            t_start = _to_datetime(t.get("scheduled_start"))
            if t_start:
                day_offset = max(0, (t_start - g_start).days)
            else:
                day_offset = 0

            bar_x = bar_origin_x + day_offset * PX_PER_DAY
            bar_width = max(PX_PER_DAY * 0.5, t_duration * PX_PER_DAY)

            if task_type == "MILESTONE":
                cx = bar_x
                cy = row_y + ROW_HEIGHT / 2
                size = 6
                d.add(Polygon(
                    [cx, cy + size, cx + size, cy, cx, cy - size, cx - size, cy],
                    fillColor=HexColor("#2c3e50"),
                    strokeColor=HexColor("#2c3e50"),
                    strokeWidth=1,
                ))
            else:
                fill_color = HexColor("#e74c3c") if is_critical else HexColor("#3498db")
                # Background bar
                d.add(Rect(bar_x, bar_y, bar_width, bar_h, fillColor=HexColor("#e9ecef"), strokeColor=None))
                # Colored bar
                d.add(Rect(bar_x, bar_y, bar_width, bar_h, fillColor=fill_color, strokeColor=None))
                # Progress overlay
                if progress > 0:
                    progress_width = bar_width * min(progress, 1.0)
                    darker = HexColor("#c0392b") if is_critical else HexColor("#2980b9")
                    d.add(Rect(bar_x, bar_y, progress_width, bar_h, fillColor=darker, strokeColor=None))
                    # Progress label
                    pct_text = f"{int(progress * 100)}%"
                    d.add(String(bar_x + 3, bar_y + bar_h / 2 - 3, pct_text, fontSize=6, fillColor=HexColor("#ffffff")))

        # --- Dependency connectors (matching UI GanttChart.tsx) ---
        # Build position lookup: source_task_uuid -> {x, width, y}
        task_positions: dict[str, dict] = {}
        for idx, t in enumerate(scheduled_tasks):
            row_y = drawing_height - HEADER_HEIGHT - (idx + 1) * ROW_HEIGHT
            t_start = _to_datetime(t.get("scheduled_start"))
            t_duration = t.get("scheduled_duration", 0) or 0
            if t_start:
                day_offset = max(0, (t_start - g_start).days)
            else:
                day_offset = 0
            bx = bar_origin_x + day_offset * PX_PER_DAY
            bw = max(PX_PER_DAY * 0.5, t_duration * PX_PER_DAY)
            src_uuid = t.get("source_task_uuid", "")
            if src_uuid:
                task_positions[src_uuid] = {"x": bx, "width": bw, "y": row_y + ROW_HEIGHT / 2}

        from reportlab.graphics.shapes import PolyLine
        for t in scheduled_tasks:
            succ_uuid = t.get("source_task_uuid", "")
            succ_pos = task_positions.get(succ_uuid)
            if not succ_pos:
                continue
            is_crit = t.get("is_critical", False)
            for pred_uuid in t.get("predecessors", []):
                pred_pos = task_positions.get(pred_uuid)
                if not pred_pos:
                    continue
                sx = pred_pos["x"] + pred_pos["width"]  # end of predecessor bar
                sy = pred_pos["y"]
                ex = succ_pos["x"]  # start of successor bar
                ey = succ_pos["y"]
                gap = ex - sx

                # Check if predecessor is also critical for connector coloring
                pred_task = next((pt for pt in scheduled_tasks if pt.get("source_task_uuid") == pred_uuid), None)
                is_crit_conn = is_crit and pred_task and pred_task.get("is_critical", False)
                conn_color = HexColor("#e74c3c") if is_crit_conn else HexColor("#adb5bd")
                conn_width = 2 if is_crit_conn else 1.5

                if gap > 24:
                    mid_x = sx + gap / 2
                    points = [sx, sy, mid_x, sy, mid_x, ey, ex, ey]
                else:
                    step_out = 6
                    back_x = min(sx, ex) - 12
                    mid_y = (sy + ey) / 2
                    points = [sx, sy, sx + step_out, sy, sx + step_out, mid_y, back_x, mid_y, back_x, ey, ex, ey]

                d.add(PolyLine(points, strokeColor=conn_color, strokeWidth=conn_width))

                # Arrowhead at the end
                arrow_size = 4
                d.add(Polygon(
                    [ex, ey, ex - arrow_size, ey - arrow_size / 2, ex - arrow_size, ey + arrow_size / 2],
                    fillColor=conn_color, strokeColor=conn_color, strokeWidth=0.5,
                ))

        # Vertical separator between table and bars
        d.add(Line(TABLE_WIDTH, 0, TABLE_WIDTH, drawing_height, strokeColor=HexColor("#cccccc"), strokeWidth=1))

        elements.append(d)
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

    # Expected Project Costs from scheduled tasks
    expected_total = sum(t.get("total_cost", 0) or 0 for t in scheduled_tasks)
    elements.append(Paragraph(f"Expected Project Costs: {expected_total:.2f}", body_style))

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
                Paragraph(str(created), body_style),
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
    time_scale: str = Query("months", pattern="^(weeks|months|quarters|years)$"),
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

    # Get scheduled tasks with source task info and predecessors
    task_records = _query_neo4j(
        """
        MATCH (source:Task)-[sched:SCHEDULED {version: $version}]->(st:ScheduledTask)
        WHERE EXISTS {
            MATCH (p {uuid: $uuid})-[:CONTAINS*]->(source)
        }
        OPTIONAL MATCH (source)<-[:PREDATES]-(pred:Task)
        WITH st, source, collect(DISTINCT pred.uuid) as predecessors
        OPTIONAL MATCH (b:Booking)-[:TO]->(source)
        WITH st, source, predecessors, COALESCE(sum(b.hours_worked), 0) as booked_hours
        RETURN st, source.title as task_title, source.task_type as task_type,
               source.uuid as source_task_uuid, predecessors,
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
        st["source_task_uuid"] = str(rec.get("source_task_uuid", ""))
        st["predecessors"] = [str(p) for p in (rec.get("predecessors") or [])]
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
    import logging
    logger = logging.getLogger(__name__)
    try:
        pdf_bytes = _generate_pdf(
            project_title=project_title,
            version=version,
            scheduled_tasks=scheduled_tasks,
            bookings=bookings,
            journal_entries=journal_entries,
            global_start=global_start,
            global_end=global_end,
            time_scale=time_scale,
        )
    except Exception:
        logger.exception("PDF generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "PDF generation failed"},
        )

    filename = f"project_report_{project_uuid}_v{version}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
