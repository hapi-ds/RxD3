"""
API routes for schedule operations with CPM integration.

This module defines REST API endpoints for:
- Creating new schedule versions for projects
- Retrieving schedule history
- Querying scheduled tasks (enriched with source task metadata)
- Querying critical path tasks
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from ..services.scheduler_service import SchedulerService, ScheduleResult, schedule_project

router = APIRouter(prefix="/api/v1/schedules", tags=["scheduling"])


async def _verify_project_exists(project_uuid: str) -> None:
    """Verify a project exists, raise 404 if not.

    Args:
        project_uuid: UUID of the project to verify.

    Raises:
        HTTPException: 404 if project not found.
    """
    from neontology import GraphConnection

    gc = GraphConnection()
    cypher = "MATCH (p:Project {uuid: $uuid}) RETURN p LIMIT 1"
    results = gc.engine.evaluate_query(cypher, {"uuid": project_uuid})

    if not results or not results.records_raw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Project not found", "uuid": project_uuid},
        )


@router.post(
    "/project/{project_uuid}",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def create_schedule(
    project_uuid: str,
    version: Optional[int] = Query(None, ge=1),
    comments: Optional[str] = Query(None, max_length=500),
):
    """Create a new schedule version for a Project Mind node.

    Runs the CPM algorithm and creates ScheduleHistory + ScheduledTask nodes.

    Args:
        project_uuid: UUID of the Project to schedule.
        version: Optional version number (auto-incremented if not provided).
        comments: Optional notes about this schedule run.

    Returns:
        Schedule result with success status, schedule_id, and version number.
    """
    await _verify_project_exists(project_uuid)

    result = await schedule_project(project_uuid, version, comments)

    # Handle error dict from scheduler
    if isinstance(result, dict):
        error_msg = result.get("error", "Scheduling failed")
        if "cycle" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result,
            )
        if "no tasks" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result,
        )

    # Fetch the created schedule to return schedule_id and version
    from neontology import GraphConnection

    gc = GraphConnection()
    cypher = """
    MATCH (p {uuid: $project_uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
    RETURN h ORDER BY h.version DESC LIMIT 1
    """
    results = gc.engine.evaluate_query(cypher, {"project_uuid": project_uuid})

    schedule_id = ""
    version_num = version or 1
    if results and results.records_raw:
        h = dict(results.records_raw[0]["h"])
        schedule_id = h.get("schedule_id", "")
        version_num = h.get("version", version_num)

    return {
        "success": True,
        "schedule_id": schedule_id,
        "version": version_num,
        "message": f"Schedule version {version_num} created successfully",
    }


@router.get(
    "/project/{project_uuid}/history",
    response_model=list[dict],
)
async def get_schedule_history(project_uuid: str):
    """Get schedule history for a project, ordered by version descending.

    Args:
        project_uuid: UUID of the project.

    Returns:
        List of ScheduleHistory node data ordered by version descending.
    """
    await _verify_project_exists(project_uuid)

    from neontology import GraphConnection

    gc = GraphConnection()

    cypher = """
    MATCH (p {uuid: $project_uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
    RETURN h ORDER BY h.version DESC
    """

    results = gc.engine.evaluate_query(cypher, {"project_uuid": project_uuid})
    schedules = []

    if results and results.records_raw:
        for record in results.records_raw:
            schedule_data = dict(record["h"])
            for key, value in schedule_data.items():
                if hasattr(value, "to_native"):
                    schedule_data[key] = value.to_native()
            schedules.append(schedule_data)

    return schedules


@router.get(
    "/project/{project_uuid}/tasks",
    response_model=list[dict],
)
async def get_scheduled_tasks(
    project_uuid: str,
    version: Optional[int] = Query(None, ge=1),
):
    """Get enriched ScheduledTask nodes for a project schedule version.

    Returns ScheduledTask data enriched with original Task title, task_type,
    hierarchy level, predecessor UUIDs, and progress (booked hours / effort).

    Args:
        project_uuid: UUID of the project.
        version: Optional version number. If omitted, returns latest version.

    Returns:
        List of enriched ScheduledTask dicts.
    """
    await _verify_project_exists(project_uuid)

    from neontology import GraphConnection

    gc = GraphConnection()

    # Determine version to use
    if version is None:
        ver_cypher = """
        MATCH (p {uuid: $project_uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
        RETURN h.version as version ORDER BY h.version DESC LIMIT 1
        """
        ver_results = gc.engine.evaluate_query(ver_cypher, {"project_uuid": project_uuid})
        if ver_results and ver_results.records_raw:
            version = ver_results.records_raw[0].get("version")
        else:
            return []

    # Get scheduled tasks with source task metadata
    cypher = """
    MATCH (source_task:Task)-[sched:SCHEDULED]->(st:ScheduledTask)
    WHERE sched.version = $version
    AND EXISTS {
        MATCH (p {uuid: $project_uuid})-[:CONTAINS*]->(source_task)
    }
    OPTIONAL MATCH (source_task)<-[:PREDATES]-(pred:Task)
    OPTIONAL MATCH path = (p {uuid: $project_uuid})-[:CONTAINS*]->(source_task)
    WITH st, source_task, sched, collect(DISTINCT pred.uuid) as predecessors, min(length(path)) as hierarchy_level
    OPTIONAL MATCH (b:Booking)-[:TO]->(source_task)
    WITH st, source_task, sched, predecessors, hierarchy_level, COALESCE(sum(b.hours_worked), 0) as booked_hours
    RETURN st, source_task.title as task_title, source_task.task_type as task_type,
           source_task.uuid as source_task_uuid, predecessors, booked_hours,
           source_task.effort as task_effort, hierarchy_level
    ORDER BY st.scheduled_start
    """

    results = gc.engine.evaluate_query(
        cypher, {"project_uuid": project_uuid, "version": version}
    )
    tasks = []

    if results and results.records_raw:
        for record in results.records_raw:
            st_data = dict(record["st"])
            for key, value in st_data.items():
                if hasattr(value, "to_native"):
                    st_data[key] = value.to_native()

            task_effort = record.get("task_effort") or 0
            booked_hours = record.get("booked_hours") or 0
            progress = (booked_hours / task_effort) if task_effort > 0 else 0.0

            enriched = {
                **st_data,
                "task_title": record.get("task_title", ""),
                "task_type": record.get("task_type", ""),
                "source_task_uuid": str(record.get("source_task_uuid", "")),
                "predecessors": [str(p) for p in (record.get("predecessors") or [])],
                "progress": min(progress, 1.0),
                "booked_hours": booked_hours,
                "hierarchy_level": record.get("hierarchy_level", 1),
            }
            tasks.append(enriched)

    return tasks


@router.get(
    "/project/{project_uuid}/critical-path",
    response_model=list[dict],
)
async def get_critical_path(project_uuid: str, version: Optional[int] = Query(None)):
    """Get critical path tasks for a specific schedule version.

    Returns tasks that have zero slack (cannot be delayed without affecting
    the project completion date).

    Args:
        project_uuid: UUID of the project.
        version: Optional version number.

    Returns:
        List of critical ScheduledTask node data.
    """
    await _verify_project_exists(project_uuid)

    from neontology import GraphConnection

    gc = GraphConnection()

    cypher = """
    MATCH (p {uuid: $project_uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
    WHERE h.version = COALESCE($version, h.version)
    WITH h ORDER BY h.version DESC LIMIT 1
    MATCH (t:Task)-[sched:SCHEDULED {version: h.version}]->(st:ScheduledTask {is_critical: true})
    WHERE EXISTS {
        MATCH (p {uuid: $project_uuid})-[:CONTAINS*]->(t)
    }
    RETURN st ORDER BY st.scheduled_start
    """

    params: dict = {"project_uuid": project_uuid, "version": version}

    results = gc.engine.evaluate_query(cypher, params)
    tasks = []

    if results and results.records_raw:
        for record in results.records_raw:
            task_data = dict(record["st"])
            for key, value in task_data.items():
                if hasattr(value, "to_native"):
                    task_data[key] = value.to_native()
            tasks.append(task_data)

    return tasks


@router.get(
    "/project/{project_uuid}/versions",
    response_model=dict,
)
async def get_available_versions(project_uuid: str):
    """Get list of available schedule versions for a project.

    Args:
        project_uuid: UUID of the project.

    Returns:
        Dict with project_uuid, total_versions count, and versions list.
    """
    await _verify_project_exists(project_uuid)

    from neontology import GraphConnection

    gc = GraphConnection()

    cypher = """
    MATCH (p {uuid: $project_uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
    RETURN h ORDER BY h.version ASC
    """

    results = gc.engine.evaluate_query(cypher, {"project_uuid": project_uuid})
    versions = []

    if results and results.records_raw:
        for record in results.records_raw:
            schedule_data = dict(record["h"])
            for key, value in schedule_data.items():
                if hasattr(value, "to_native"):
                    schedule_data[key] = value.to_native()
            versions.append(schedule_data)

    return {
        "project_uuid": project_uuid,
        "total_versions": len(versions),
        "versions": versions,
    }
