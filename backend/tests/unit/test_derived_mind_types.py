"""Unit tests for derived Mind types.

Tests validate all 18 specialized Mind types.
"""

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from src.models.enums import PriorityEnum, ProbabilityEnum, SeverityEnum, StatusEnum
from src.models.mind_types import (
    AcceptanceCriteria,
    Company,
    Department,
    DesignInput,
    DesignOutput,
    Email,
    Employee,
    Failure,
    Knowledge,
    Milestone,
    Phase,
    ProcessRequirement,
    Project,
    Risk,
    Task,
    UserNeed,
    UserStory,
    WorkInstructionRequirement,
)


class TestProject:
    """Test Project mind type."""

    def test_valid_project(self):
        """Test that a valid Project can be created."""
        project = Project(
            title="Test Project",
            creator="test@example.com",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            budget=50000.0
        )

        assert project.title == "Test Project"
        assert project.start_date == date(2024, 1, 1)
        assert project.end_date == date(2024, 12, 31)
        assert project.budget == 50000.0

    def test_project_without_budget(self):
        """Test that Project can be created without budget."""
        project = Project(
            title="Project Without Budget",
            creator="test@example.com",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31)
        )

        assert project.budget is None


class TestTask:
    """Test Task mind type."""

    def test_valid_task(self):
        """Test that a valid Task can be created."""
        task = Task(
            title="Test Task",
            creator="test@example.com",
            priority=PriorityEnum.HIGH,
            assignee="dev@example.com"
        )

        assert task.title == "Test Task"
        assert task.priority == PriorityEnum.HIGH
        assert task.assignee == "dev@example.com"

    def test_task_with_due_date(self):
        """Test that Task can be created with due date."""
        task = Task(
            title="Task With Due Date",
            creator="test@example.com",
            priority=PriorityEnum.CRITICAL,
            assignee="dev@example.com",
            due_date=date(2024, 6, 30),
            estimated_hours=40
        )

        assert task.due_date == date(2024, 6, 30)
        assert task.estimated_hours == 40

    def test_task_invalid_priority(self):
        """Test that invalid priority raises ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            Task(
                title="Test Task",
                creator="test@example.com",
                assignee="dev@example.com",
                priority="invalid_priority"  # type: ignore[call-arg]
            )

        errors = exc_info.value.errors()
        assert any(e["type"] == "enum" for e in errors)


class TestRisk:
    """Test Risk mind type."""

    def test_valid_risk(self):
        """Test that a valid Risk can be created."""
        risk = Risk(
            title="Technical Risk",
            creator="test@example.com",
            severity=SeverityEnum.HIGH,
            probability=ProbabilityEnum.LIKELY
        )

        assert risk.title == "Technical Risk"
        assert risk.severity == SeverityEnum.HIGH
        assert risk.probability == ProbabilityEnum.LIKELY

    def test_risk_with_mitigation(self):
        """Test that Risk can be created with mitigation plan."""
        risk = Risk(
            title="Risk With Mitigation",
            creator="test@example.com",
            severity=SeverityEnum.MEDIUM,
            probability=ProbabilityEnum.UNLIKELY,
            mitigation_plan="Monitor and review regularly"
        )

        assert risk.mitigation_plan == "Monitor and review regularly"


class TestUserStory:
    """Test UserStory mind type."""

    def test_valid_user_story(self):
        """Test that a valid UserStory can be created."""
        story = UserStory(
            title="Login Feature",
            creator="test@example.com",
            as_a="Registered User",
            i_want="login to the system",
            so_that="I can access my data"
        )

        assert story.as_a == "Registered User"
        assert story.i_want == "login to the system"
        assert story.so_that == "I can access my data"


class TestUserNeed:
    """Test UserNeed mind type."""

    def test_valid_user_need(self):
        """Test that a valid UserNeed can be created."""
        need = UserNeed(
            title="Mobile Access",
            creator="test@example.com",
            priority=PriorityEnum.HIGH,
            need_statement="Users need to access the system from mobile devices"
        )

        assert need.need_statement == "Users need to access the system from mobile devices"


class TestAcceptanceCriteria:
    """Test AcceptanceCriteria mind type."""

    def test_valid_acceptance_criteria(self):
        """Test that a valid AcceptanceCriteria can be created."""
        criteria = AcceptanceCriteria(
            title="Login Validation",
            creator="test@example.com",
            status=StatusEnum.DRAFT,
            criteria_text="User must provide valid credentials",
            verification_method="Manual testing"
        )

        assert criteria.criteria_text == "User must provide valid credentials"
        assert criteria.verification_method == "Manual testing"


class TestDesignInput:
    """Test DesignInput mind type."""

    def test_valid_design_input(self):
        """Test that a valid DesignInput can be created."""
        design_input = DesignInput(
            title="Requirements",
            creator="test@example.com",
            source="Client Meeting",
            input_type="Functional Requirement",
            content="System must support multi-factor authentication"
        )

        assert design_input.source == "Client Meeting"
        assert design_input.input_type == "Functional Requirement"


class TestDesignOutput:
    """Test DesignOutput mind type."""

    def test_valid_design_output(self):
        """Test that a valid DesignOutput can be created."""
        design_output = DesignOutput(
            title="Architecture Diagram",
            creator="test@example.com",
            output_type="System Architecture",
            verification_status="Approved",
            content="Complete architecture documentation"
        )

        assert design_output.output_type == "System Architecture"
        assert design_output.verification_status == "Approved"


class TestFailure:
    """Test Failure mind type."""

    def test_valid_failure(self):
        """Test that a valid Failure can be created."""
        failure = Failure(
            title="Component Failure",
            creator="test@example.com",
            failure_mode="Overheating",
            effects="System shutdown",
            causes="Poor cooling design"
        )

        assert failure.failure_mode == "Overheating"
        assert failure.effects == "System shutdown"


class TestEmployee:
    """Test Employee mind type."""

    def test_valid_employee(self):
        """Test that a valid Employee can be created."""
        employee = Employee(
            title="John Doe",
            creator="test@example.com",
            email="john@example.com",
            hire_date=date(2024, 1, 1),
            role="Software Engineer"
        )

        assert employee.email == "john@example.com"
        assert employee.role == "Software Engineer"


class TestEmail:
    """Test Email mind type."""

    def test_valid_email(self):
        """Test that a valid Email can be created."""
        email = Email(
            title="Meeting Invitation",
            creator="test@example.com",
            sender="organizer@example.com",
            recipients=["attendee1@example.com", "attendee2@example.com"],
            subject="Project Meeting",
            sent_at=datetime(2024, 3, 7)
        )

        assert email.sender == "organizer@example.com"
        assert email.subject == "Project Meeting"


class TestKnowledge:
    """Test Knowledge mind type."""

    def test_valid_knowledge(self):
        """Test that a valid Knowledge can be created."""
        knowledge = Knowledge(
            title="API Documentation",
            creator="test@example.com",
            category="Development",
            tags=["api", "documentation"],
            content="Complete API reference"
        )

        assert knowledge.category == "Development"
        assert knowledge.content == "Complete API reference"


class TestMilestone:
    """Test Milestone mind type."""

    def test_valid_milestone(self):
        """Test that a valid Milestone can be created."""
        milestone = Milestone(
            title="Phase 1 Complete",
            creator="test@example.com",
            target_date=date(2024, 6, 30),
            completion_percentage=0
        )

        assert milestone.target_date == date(2024, 6, 30)
        assert milestone.completion_percentage == 0


class TestPhase:
    """Test Phase mind type."""

    def test_valid_phase(self):
        """Test that a valid Phase can be created."""
        phase = Phase(
            title="Development Phase",
            creator="test@example.com",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 6, 30),
            phase_number=1
        )

        assert phase.phase_number == 1


class TestCompany:
    """Test Company mind type."""

    def test_valid_company(self):
        """Test that a valid Company can be created."""
        company = Company(
            title="Acme Corp",
            creator="test@example.com",
            industry="Technology"
        )

        assert company.industry == "Technology"


class TestDepartment:
    """Test Department mind type."""

    def test_valid_department(self):
        """Test that a valid Department can be created."""
        department = Department(
            title="Engineering",
            creator="test@example.com",
            department_code="ENG"
        )

        assert department.department_code == "ENG"


class TestProcessRequirement:
    """Test ProcessRequirement mind type."""

    def test_valid_process_requirement(self):
        """Test that a valid ProcessRequirement can be created."""
        requirement = ProcessRequirement(
            title="Quality Control",
            creator="test@example.com",
            process_name="Manufacturing",
            requirement_text="All products must pass inspection"
        )

        assert requirement.process_name == "Manufacturing"
        assert requirement.requirement_text == "All products must pass inspection"


class TestWorkInstructionRequirement:
    """Test WorkInstructionRequirement mind type."""

    def test_valid_work_instruction(self):
        """Test that a valid WorkInstructionRequirement can be created."""
        instruction = WorkInstructionRequirement(
            title="Safety Procedure",
            creator="test@example.com",
            instruction_id="WI-001",
            procedure="Follow safety checklist before operation",
            safety_critical=True
        )

        assert instruction.instruction_id == "WI-001"
        assert instruction.procedure == "Follow safety checklist before operation"
