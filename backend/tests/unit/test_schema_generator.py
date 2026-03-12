"""
Unit tests for the schema generator script.

**Validates: Requirement 1 (Schema Auto-Generation from Data Model)**
"""

import sys
from pathlib import Path

import pytest

# Add scripts directory to path
scripts_dir = Path(__file__).parent.parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))

from generate_schemas import (
    parse_base_mind_fields,
    parse_mind_types,
    parse_enums,
    parse_type_annotation,
)


def test_parse_base_mind_fields():
    """Test parsing BaseMind fields from mind.py."""
    models_dir = Path(__file__).parent.parent.parent / "src" / "models"
    mind_file = models_dir / "mind.py"
    
    base_fields = parse_base_mind_fields(mind_file)
    
    # Should have core BaseMind fields
    field_names = [f.name for f in base_fields]
    assert "uuid" in field_names
    assert "title" in field_names
    assert "version" in field_names
    assert "updated_at" in field_names
    assert "creator" in field_names
    assert "status" in field_names
    assert "description" in field_names
    
    # Check that status is recognized as an enum
    status_field = next(f for f in base_fields if f.name == "status")
    assert status_field.is_enum
    assert status_field.enum_type == "StatusEnum"


def test_parse_mind_types():
    """Test parsing Mind types from mind_types.py."""
    models_dir = Path(__file__).parent.parent.parent / "src" / "models"
    mind_file = models_dir / "mind.py"
    mind_types_file = models_dir / "mind_types.py"
    
    base_fields = parse_base_mind_fields(mind_file)
    mind_types = parse_mind_types(mind_types_file, base_fields)
    
    # Should have all Mind types
    assert "Task" in mind_types
    assert "Project" in mind_types
    assert "Resource" in mind_types
    assert "Requirement" in mind_types
    
    # Task should have both base and derived fields
    task = mind_types["Task"]
    field_names = [f.name for f in task.fields]
    
    # Base fields
    assert "title" in field_names
    assert "creator" in field_names
    assert "status" in field_names
    
    # Task-specific fields
    assert "priority" in field_names
    assert "assignee" in field_names
    assert "task_type" in field_names
    
    # Check enum fields
    priority_field = next(f for f in task.fields if f.name == "priority")
    assert priority_field.is_enum
    assert priority_field.enum_type == "PriorityEnum"


def test_parse_enums():
    """Test parsing enums from enums.py."""
    models_dir = Path(__file__).parent.parent.parent / "src" / "models"
    enums_file = models_dir / "enums.py"
    
    enums = parse_enums(enums_file)
    
    # Should have all enum types
    assert "StatusEnum" in enums
    assert "PriorityEnum" in enums
    assert "TaskType" in enums
    assert "ResourceType" in enums
    assert "AccountType" in enums
    
    # Check enum values
    status_enum = enums["StatusEnum"]
    assert "DRAFT" in status_enum.values
    assert "ACTIVE" in status_enum.values
    assert "DONE" in status_enum.values


def test_parse_type_annotation():
    """Test parsing type annotations."""
    import ast
    
    # Test simple type
    node = ast.parse("x: str").body[0].annotation
    type_str, is_optional, is_enum, enum_type = parse_type_annotation(node)
    assert type_str == "str"
    assert not is_optional
    assert not is_enum
    
    # Test Optional type
    node = ast.parse("x: Optional[str]").body[0].annotation
    type_str, is_optional, is_enum, enum_type = parse_type_annotation(node)
    assert type_str == "str"
    assert is_optional
    
    # Test union type with None
    node = ast.parse("x: str | None").body[0].annotation
    type_str, is_optional, is_enum, enum_type = parse_type_annotation(node)
    assert type_str == "str"
    assert is_optional
    
    # Test list type
    node = ast.parse("x: list[str]").body[0].annotation
    type_str, is_optional, is_enum, enum_type = parse_type_annotation(node)
    assert type_str == "list[str]"
    assert not is_optional


def test_generated_schemas_exist():
    """Test that generated schemas file exists and is valid Python."""
    schemas_file = Path(__file__).parent.parent.parent / "src" / "schemas" / "minds.py"
    
    assert schemas_file.exists(), "Generated schemas file should exist"
    
    # Check that some expected schemas exist by importing properly
    from src.schemas.minds import (
        TaskCreate, TaskUpdate, TaskResponse,
        ProjectCreate, ResourceCreate
    )
    
    # Verify they are classes
    assert TaskCreate is not None
    assert TaskUpdate is not None
    assert TaskResponse is not None
    assert ProjectCreate is not None
    assert ResourceCreate is not None


def test_schema_has_enum_serializers():
    """Test that generated schemas have enum serializers and validators."""
    from src.schemas.minds import TaskCreate, ResourceCreate
    
    # TaskCreate should have serializers for priority and task_type
    assert hasattr(TaskCreate, "serialize_priority")
    assert hasattr(TaskCreate, "validate_priority")
    assert hasattr(TaskCreate, "serialize_task_type")
    assert hasattr(TaskCreate, "validate_task_type")
    
    # ResourceCreate should have serializers for resource_type
    assert hasattr(ResourceCreate, "serialize_resource_type")
    assert hasattr(ResourceCreate, "validate_resource_type")


def test_schema_field_requirements():
    """Test that schemas have correct required/optional fields."""
    from src.schemas.minds import TaskCreate, TaskUpdate
    
    # TaskCreate should have required fields
    task_create_fields = TaskCreate.model_fields
    assert "title" in task_create_fields
    assert "creator" in task_create_fields
    assert "priority" in task_create_fields
    assert "assignee" in task_create_fields
    
    # Check that required fields don't have defaults (except status)
    assert task_create_fields["title"].is_required()
    assert task_create_fields["creator"].is_required()
    assert task_create_fields["priority"].is_required()
    assert task_create_fields["assignee"].is_required()
    
    # Optional fields should have defaults
    assert not task_create_fields["description"].is_required()
    assert not task_create_fields["due_date"].is_required()
    
    # TaskUpdate should have all fields optional
    task_update_fields = TaskUpdate.model_fields
    for field_name, field_info in task_update_fields.items():
        assert not field_info.is_required(), f"Field {field_name} should be optional in Update schema"
