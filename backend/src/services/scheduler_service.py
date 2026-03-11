"""
Scheduler Service with Critical Path Method (CPM) algorithm.

This module implements task scheduling using the Critical Path Method algorithm,
supporting multiple schedule versions and proper version tracking via SCHEDULED
relationships between INPUT and SCHEDULED layer nodes.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from neontology import GraphConnection


class ScheduleResult:
    """Schedule result status codes."""
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class SchedulerService:
    """
    Service class for scheduling Mind nodes using CPM algorithm.
    """

    def __init__(
        self,
        business_hours_start: int = 8,
        business_hours_end: int = 17,
        working_days: list[int] | None = None,
        holidays: list[datetime] | None = None,
    ):
        self.business_hours_start = business_hours_start
        self.business_hours_end = business_hours_end
        self.working_days = working_days or [0, 1, 2, 3, 4]
        self.holidays = holidays or []
        self.scheduled_tasks: dict[str, dict] = {}
        self.critical_path: list[str] = []

    async def schedule_project(
        self,
        project_uuid: str,
        version: int | None = None,
        comments: str | None = None,
    ) -> ScheduleResult:
        """
        Create a new schedule version for a Project Mind node.
        """
        from ..models.mind_types import Project

        gc = GraphConnection()

        project = await self._get_project_node(project_uuid)
        if not project:
            return ScheduleResult.ERROR

        start_date = getattr(project, "start_date", datetime.now(timezone.utc))
        end_date = getattr(project, "end_date", None)

        if not end_date:
            end_date = start_date + timedelta(days=365)

        task_nodes = await self._get_project_tasks(project_uuid)
        if not task_nodes:
            return ScheduleResult.ERROR

        version_num = version or await self._get_next_version_number(project_uuid)
        schedule_id = f"{project_uuid}_v{version_num}"

        from ..models.mind_types import ScheduleHistory
        from ..models.enums import StatusEnum

        history_node = ScheduleHistory(
            uuid=None,
            title=f"Schedule {version_num} for {project.title}",
            description=comments,
            status=StatusEnum.DONE,
            schedule_id=schedule_id,
            scheduled_at=datetime.now(timezone.utc),
        )
        history_node.create()

        sorted_tasks = await self._build_and_sort_task_graph(task_nodes)

        if not sorted_tasks:
            return ScheduleResult.ERROR

        await self._calculate_earliest_dates(sorted_tasks, start_date)
        await self._calculate_latest_dates(sorted_tasks, end_date)
        self.critical_path = await self._identify_critical_path(sorted_tasks)
        await self._calculate_slack(sorted_tasks)

        from ..models.mind_types import ScheduledTask
        from ..models.mind import Scheduled

        for task_data in sorted_tasks:
            input_task = task_data["task"]
            scheduled_task = await self._create_scheduled_task(
                task_data=task_data,
                schedule_history=history_node,
                source_task=input_task,
            )

            scheduled_rel = Scheduled(
                source=input_task,
                target=scheduled_task,
                version=version_num,
                scheduled_at=datetime.now(timezone.utc),
            )
            scheduled_rel.create()

        history_node.total_effort = sum(
            t.get("scheduled_duration", 0) for t in self.scheduled_tasks.values()
        )

        all_starts = [t.get("earliest_start") for t in self.scheduled_tasks.values()]
        all_ends = [t.get("earliest_end") for t in self.scheduled_tasks.values()]

        history_node.global_start = min(all_starts) if all_starts else None
        history_node.global_end = max(all_ends) if all_ends else None

        history_node.update()

        return ScheduleResult.SUCCESS

    async def _get_project_node(self, project_uuid: str):
        """Get Project node by UUID."""
        from ..models.mind_types import Project

        try:
            project = Project.match(project_uuid)
            if project:
                return project

            gc = GraphConnection()
            cypher = "MATCH (p:Project {uuid: $uuid}) RETURN p ORDER BY p.version DESC LIMIT 1"
            results = gc.engine.evaluate_query(cypher, {"uuid": project_uuid})

            if results and results.records_raw:
                record = results.records_raw[0]
                return Project(**dict(record["p"]))

        except Exception:
            pass

        return None

    async def _get_project_tasks(self, project_uuid: str):
        """Get all Task nodes contained in a project."""
        gc = GraphConnection()

        cypher = """
        MATCH (p {uuid: $project_uuid})-[:CONTAINS]->(t:Task)
        WITH t ORDER BY t.version DESC
        RETURN DISTINCT t.uuid as uuid, t.title as title
        """

        results = gc.engine.evaluate_query(cypher, {"project_uuid": project_uuid})
        tasks = []

        if results and results.records_raw:
            for record in results.records_raw:
                task_data = dict(record["t"]) if "t" in record else {}
                if not task_data:
                    continue

                for key, value in task_data.items():
                    if hasattr(value, "to_native"):
                        task_data[key] = value.to_native()

                from ..models.mind_types import Task

                try:
                    task = Task(**task_data)
                    tasks.append(task)
                except Exception:
                    continue

        return tasks

    async def _get_next_version_number(self, project_uuid: str) -> int:
        """Get the next version number for a project's schedule."""
        gc = GraphConnection()

        cypher = """
        MATCH (p {uuid: $project_uuid})-[:HAS_SCHEDULED]->(h:ScheduleHistory)
        WITH MAX(h.version) as max_version
        RETURN COALESCE(max_version, 0) + 1 as next_version
        """

        results = gc.engine.evaluate_query(cypher, {"project_uuid": project_uuid})

        if results and results.records_raw:
            return results.records_raw[0].get("next_version", 1)

        return 1

    async def _build_and_sort_task_graph(self, tasks: list):
        """Build dependency graph and topologically sort tasks."""
        task_graph = {}

        for task in tasks:
            task_id = str(task.uuid)
            predecessors = []

            gc = GraphConnection()
            pred_cypher = """
            MATCH (t {uuid: $task_uuid})<-[:PREDATES]-(pred:Task)
            RETURN DISTINCT pred.uuid as uuid
            """

            pred_results = gc.engine.evaluate_query(pred_cypher, {"task_uuid": task_id})

            if pred_results and pred_results.records_raw:
                for record in pred_results.records_raw:
                    predecessors.append(str(record["uuid"]))

            task_graph[task_id] = {
                "task": task,
                "predecessors": predecessors,
                "successors": [],
                "earliest_start": None,
                "earliest_end": None,
                "latest_start": None,
                "latest_end": None,
            }

        for tid, data in task_graph.items():
            for pred_id in data["predecessors"]:
                if pred_id in task_graph:
                    task_graph[pred_id]["successors"].append(tid)

        in_degree = {tid: len(data["predecessors"]) for tid, data in task_graph.items()}
        queue = [tid for tid, deg in in_degree.items() if deg == 0]
        sorted_tasks = []

        while queue:
            current_id = queue.pop(0)
            if current_id not in task_graph:
                continue

            sorted_tasks.append(task_graph[current_id])

            for successor_id in task_graph[current_id]["successors"]:
                if successor_id in in_degree:
                    in_degree[successor_id] -= 1
                    if in_degree[successor_id] == 0:
                        queue.append(successor_id)

        return sorted_tasks

    async def _calculate_earliest_dates(self, sorted_tasks: list, start_date: datetime):
        """Forward pass - calculate earliest dates."""
        for task_data in sorted_tasks:
            task = task_data["task"]

            task_start = getattr(task, "start", None)

            if task_start and isinstance(task_start, datetime):
                earliest_start = self._normalize_date(task_start)
            else:
                earliest_start = start_date

                for pred_id in task_data["predecessors"]:
                    if pred_id in self.scheduled_tasks:
                        pred_end = self.scheduled_tasks[pred_id]["scheduled_end"]
                        earliest_start = max(earliest_start, pred_end)

                earliest_start = self._adjust_for_holidays(earliest_start)

            duration_days = 1

            if hasattr(task, "length") and task.length:
                duration_days = task.length
            elif hasattr(task, "estimated_hours") and task.estimated_hours:
                duration_days = task.estimated_hours / 8

            task_data["earliest_start"] = earliest_start
            task_data["earliest_end"] = earliest_start + timedelta(days=duration_days)

            self.scheduled_tasks[str(task.uuid)] = {
                "scheduled_start": earliest_start,
                "scheduled_end": earliest_start + timedelta(days=duration_days),
                "scheduled_duration": duration_days,
                "is_critical": False,
            }

    async def _calculate_latest_dates(self, sorted_tasks: list, project_end: datetime):
        """Backward pass - calculate latest dates."""
        for task_data in reversed(sorted_tasks):
            task_id = str(task_data["task"].uuid)

            if not task_data["successors"]:
                latest_end = self._normalize_date(project_end)
            else:
                successors_with_dates = [
                    s for s in task_data["successors"]
                    if s in self.scheduled_tasks
                ]
                latest_end = min(
                    self.scheduled_tasks[succ_id]["scheduled_start"]
                    for succ_id in successors_with_dates
                ) if successors_with_dates else project_end

            duration_days = self.scheduled_tasks[task_id].get("scheduled_duration", 1)

            task_data["latest_start"] = max(
                task_data["earliest_start"],
                latest_end - timedelta(days=duration_days)
            )
            task_data["latest_end"] = latest_end

            self.scheduled_tasks[task_id]["scheduled_start"] = task_data["latest_start"]

    async def _identify_critical_path(self, sorted_tasks: list) -> list[str]:
        """Identify tasks on the critical path."""
        critical_path = []

        for task_data in sorted_tasks:
            slack_start = (
                task_data["latest_start"] - task_data["earliest_start"]
            )

            is_critical = abs(slack_start.total_seconds()) < 60
            task_data["is_critical"] = is_critical
            task_data["slack_start"] = slack_start

            if is_critical:
                critical_path.append(str(task_data["task"].uuid))

        return critical_path

    async def _calculate_slack(self, sorted_tasks: list):
        """Calculate slack times for all tasks."""
        for task_data in sorted_tasks:
            self.scheduled_tasks[str(task_data["task"].uuid)]["slack_end"] = (
                task_data["latest_end"] - task_data["earliest_end"]
            )

    async def _create_scheduled_task(self, task_data: dict, schedule_history, source_task):
        """Create a ScheduledTask node."""
        from ..models.mind_types import ScheduledTask
        from ..models.enums import StatusEnum

        scheduled_start = task_data.get("scheduled_start", task_data["earliest_start"])
        scheduled_end = task_data.get("scheduled_end", task_data["earliest_end"])

        scheduled_task = ScheduledTask(
            uuid=None,
            title=f"Scheduled: {source_task.title}",
            description="Computed schedule state",
            status=StatusEnum.DONE,
            source_task_uuid=source_task.uuid,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            scheduled_duration=self.scheduled_tasks[str(source_task.uuid)].get("scheduled_duration"),
            is_critical=task_data.get("is_critical", False),
            slack_start=task_data.get("slack_start", timedelta(0)),
            slack_end=self.scheduled_tasks[str(source_task.uuid)].get("slack_end", timedelta(0)),
        )
        scheduled_task.create()

        return scheduled_task

    def _normalize_date(self, date: datetime) -> datetime:
        """Normalize to business hours start."""
        return datetime(
            date.year, date.month, date.day,
            self.business_hours_start, 0, 0,
            tzinfo=date.tzinfo or timezone.utc
        )

    def _adjust_for_holidays(self, date: datetime) -> datetime:
        """Adjust date to skip holidays and weekends."""
        while (
            date.weekday() not in self.working_days
            or date.date() in [h.date() for h in self.holidays]
        ):
            date += timedelta(days=1)

        return self._normalize_date(date)


async def schedule_project(
    project_uuid: str,
    version: int | None = None,
    comments: str | None = None,
) -> ScheduleResult:
    """Convenience function to schedule a project."""
    scheduler = SchedulerService()
    return await scheduler.schedule_project(project_uuid, version, comments)
