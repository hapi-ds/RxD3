#!/usr/bin/env python3
"""
Schema Generator Script for Mind-Based Data Model System.

This script parses the data model files (mind.py, mind_types.py, enums.py)
using Python's AST and generates Pydantic schemas for API request/response
validation.

For each Mind type, it generates:
- MindCreate: For POST requests (excludes auto-generated fields)
- MindUpdate: For PATCH requests (all fields optional)
- MindResponse: For GET responses (includes all fields)

Usage:
    cd backend
    uv run python scripts/generate_schemas.py

**Validates: Requirement 1 (Schema Auto-Generation from Data Model)**
"""

import ast
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class FieldInfo:
    """Information about a field in a Mind type."""
    name: str
    type_annotation: str
    is_optional: bool
    default_value: str | None
    is_enum: bool = False
    enum_type: str | None = None


@dataclass
class MindTypeInfo:
    """Information about a Mind type class."""
    name: str
    fields: list[FieldInfo] = field(default_factory=list)
    base_class: str = "BaseMind"


@dataclass
class EnumInfo:
    """Information about an enum type."""
    name: str
    values: list[str]


def parse_type_annotation(node: ast.expr) -> tuple[str, bool, bool, str | None]:
    """
    Parse a type annotation node and return (type_str, is_optional, is_enum, enum_type).
    
    Args:
        node: AST node representing the type annotation
        
    Returns:
        Tuple of (type_string, is_optional, is_enum, enum_type_name)
    """
    is_optional = False
    is_enum = False
    enum_type = None
    
    if isinstance(node, ast.Name):
        type_str = node.id
        # Check if it's a known enum type
        if type_str in ['StatusEnum', 'PriorityEnum', 'SeverityEnum', 'ProbabilityEnum',
                        'ResourceType', 'AccountType', 'TaskType', 'RequirementType']:
            is_enum = True
            enum_type = type_str
        return type_str, is_optional, is_enum, enum_type
    
    elif isinstance(node, ast.Subscript):
        # Handle Optional[X], list[X], etc.
        if isinstance(node.value, ast.Name):
            container = node.value.id
            
            if container == "Optional":
                is_optional = True
                inner_type, _, inner_is_enum, inner_enum_type = parse_type_annotation(node.slice)
                return inner_type, is_optional, inner_is_enum, inner_enum_type
            
            elif container == "list":
                inner_type, _, inner_is_enum, inner_enum_type = parse_type_annotation(node.slice)
                return f"list[{inner_type}]", is_optional, inner_is_enum, inner_enum_type
            
            else:
                # Generic container
                inner_type, _, inner_is_enum, inner_enum_type = parse_type_annotation(node.slice)
                return f"{container}[{inner_type}]", is_optional, inner_is_enum, inner_enum_type
    
    elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitOr):
        # Handle Union types (X | Y)
        left_type, _, left_is_enum, left_enum_type = parse_type_annotation(node.left)
        right_type, _, right_is_enum, right_enum_type = parse_type_annotation(node.right)
        
        # Check if it's Optional (X | None)
        if right_type == "None":
            is_optional = True
            return left_type, is_optional, left_is_enum, left_enum_type
        elif left_type == "None":
            is_optional = True
            return right_type, is_optional, right_is_enum, right_enum_type
        
        return f"{left_type} | {right_type}", is_optional, False, None
    
    elif isinstance(node, ast.Constant):
        return str(node.value), is_optional, is_enum, enum_type
    
    # Fallback
    return "Any", is_optional, is_enum, enum_type


def parse_base_mind_fields(file_path: Path) -> list[FieldInfo]:
    """
    Parse mind.py and extract BaseMind field definitions.
    
    Args:
        file_path: Path to mind.py
        
    Returns:
        List of FieldInfo objects for BaseMind fields
    """
    with open(file_path, 'r') as f:
        tree = ast.parse(f.read())
    
    base_fields = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "BaseMind":
            # Extract fields from BaseMind class body
            for item in node.body:
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    field_name = item.target.id
                    
                    # Skip special fields
                    if field_name.startswith('__'):
                        continue
                    
                    # Parse type annotation
                    type_str, is_optional, is_enum, enum_type = parse_type_annotation(item.annotation)
                    
                    # Extract default value if present
                    default_value = None
                    if item.value:
                        if isinstance(item.value, ast.Call):
                            # Field(...) or Field(default=...)
                            if isinstance(item.value.func, ast.Name) and item.value.func.id == "Field":
                                # Check for default in args or keywords
                                if item.value.args:
                                    if isinstance(item.value.args[0], ast.Constant):
                                        default_value = repr(item.value.args[0].value)
                                    elif isinstance(item.value.args[0], ast.Attribute):
                                        # Handle enum defaults like StatusEnum.DRAFT
                                        default_value = f"{ast.unparse(item.value.args[0])}"
                                
                                for kw in item.value.keywords:
                                    if kw.arg == "default":
                                        if isinstance(kw.value, ast.Constant):
                                            default_value = repr(kw.value.value)
                                        elif isinstance(kw.value, ast.Attribute):
                                            default_value = f"{ast.unparse(kw.value)}"
                                        elif isinstance(kw.value, ast.Name):
                                            default_value = kw.value.id
                                    elif kw.arg == "default_factory":
                                        default_value = "default_factory"
                        elif isinstance(item.value, ast.Constant):
                            default_value = repr(item.value.value)
                    
                    field_info = FieldInfo(
                        name=field_name,
                        type_annotation=type_str,
                        is_optional=is_optional,
                        default_value=default_value,
                        is_enum=is_enum,
                        enum_type=enum_type
                    )
                    base_fields.append(field_info)
            break
    
    return base_fields


def parse_mind_types(file_path: Path, base_fields: list[FieldInfo]) -> dict[str, MindTypeInfo]:
    """
    Parse mind_types.py and extract Mind type definitions.
    
    Args:
        file_path: Path to mind_types.py
        base_fields: List of BaseMind fields to include in each type
        
    Returns:
        Dictionary mapping Mind type names to MindTypeInfo objects
    """
    with open(file_path, 'r') as f:
        tree = ast.parse(f.read())
    
    mind_types = {}
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Check if it's a Mind type (inherits from BaseMind)
            if any(isinstance(base, ast.Name) and base.id == "BaseMind" for base in node.bases):
                mind_type = MindTypeInfo(name=node.name)
                
                # Start with base fields
                mind_type.fields.extend(base_fields)
                
                # Extract fields from class body
                for item in node.body:
                    if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                        field_name = item.target.id
                        
                        # Skip special fields
                        if field_name.startswith('__'):
                            continue
                        
                        # Parse type annotation
                        type_str, is_optional, is_enum, enum_type = parse_type_annotation(item.annotation)
                        
                        # Extract default value if present
                        default_value = None
                        if item.value:
                            if isinstance(item.value, ast.Call):
                                # Field(...) or Field(default=...)
                                if isinstance(item.value.func, ast.Name) and item.value.func.id == "Field":
                                    # Check for default in args or keywords
                                    if item.value.args:
                                        if isinstance(item.value.args[0], ast.Constant):
                                            default_value = repr(item.value.args[0].value)
                                        elif isinstance(item.value.args[0], ast.Attribute):
                                            # Handle enum defaults like StatusEnum.DRAFT
                                            default_value = f"{ast.unparse(item.value.args[0])}"
                                    
                                    for kw in item.value.keywords:
                                        if kw.arg == "default":
                                            if isinstance(kw.value, ast.Constant):
                                                default_value = repr(kw.value.value)
                                            elif isinstance(kw.value, ast.Attribute):
                                                default_value = f"{ast.unparse(kw.value)}"
                                            elif isinstance(kw.value, ast.Name):
                                                default_value = kw.value.id
                                        elif kw.arg == "default_factory":
                                            default_value = "default_factory"
                            elif isinstance(item.value, ast.Constant):
                                default_value = repr(item.value.value)
                        
                        field_info = FieldInfo(
                            name=field_name,
                            type_annotation=type_str,
                            is_optional=is_optional,
                            default_value=default_value,
                            is_enum=is_enum,
                            enum_type=enum_type
                        )
                        mind_type.fields.append(field_info)
                
                mind_types[node.name] = mind_type
    
    return mind_types


def parse_enums(file_path: Path) -> dict[str, EnumInfo]:
    """
    Parse enums.py and extract enum definitions.
    
    Args:
        file_path: Path to enums.py
        
    Returns:
        Dictionary mapping enum names to EnumInfo objects
    """
    with open(file_path, 'r') as f:
        tree = ast.parse(f.read())
    
    enums = {}
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Check if it's an Enum class
            if any((isinstance(base, ast.Name) and base.id == "Enum") or
                   (isinstance(base, ast.Subscript) and isinstance(base.value, ast.Name) and base.value.id == "Enum")
                   for base in node.bases):
                enum_info = EnumInfo(name=node.name, values=[])
                
                # Extract enum values
                for item in node.body:
                    if isinstance(item, ast.Assign):
                        for target in item.targets:
                            if isinstance(target, ast.Name):
                                enum_info.values.append(target.id)
                
                enums[node.name] = enum_info
    
    return enums


def get_base_fields() -> list[str]:
    """Return list of BaseMind fields that should be excluded from Create schemas."""
    return ['uuid', 'version', 'updated_at']


def generate_create_schema(mind_type: MindTypeInfo, enums: dict[str, EnumInfo]) -> str:
    """
    Generate MindCreate schema code for a Mind type.
    
    Args:
        mind_type: MindTypeInfo object
        enums: Dictionary of enum definitions
        
    Returns:
        Generated schema code as string
    """
    base_fields = get_base_fields()
    
    # Filter out auto-generated fields
    create_fields = [f for f in mind_type.fields if f.name not in base_fields]
    
    lines = [
        f"class {mind_type.name}Create(BaseModel):",
        f'    """Schema for creating a {mind_type.name}."""',
        ""
    ]
    
    # Add fields
    for field_info in create_fields:
        type_str = field_info.type_annotation
        
        # Determine if field is required or has a default
        # Field(...) means required, Field(default=X) means optional with default
        is_required = (field_info.default_value == 'Ellipsis' or 
                      field_info.default_value is None and not field_info.is_optional)
        
        if is_required and not field_info.is_optional:
            # Required field - no default value
            lines.append(f"    {field_info.name}: {type_str}")
        elif field_info.is_optional or field_info.default_value:
            # Optional field or has default
            if field_info.default_value and field_info.default_value not in ['default_factory', 'Ellipsis']:
                # Has explicit default value
                lines.append(f"    {field_info.name}: {type_str} | None = {field_info.default_value}")
            else:
                # Optional with None default
                lines.append(f"    {field_info.name}: {type_str} | None = None")
        else:
            # Fallback to required
            lines.append(f"    {field_info.name}: {type_str}")
    
    # Add enum serializers and validators (track to avoid duplicates)
    enum_fields = [f for f in create_fields if f.is_enum]
    added_serializers = set()
    
    if enum_fields:
        lines.append("")
        for field_info in enum_fields:
            # Skip if we already added serializer for this field name
            if field_info.name in added_serializers:
                continue
            added_serializers.add(field_info.name)
            
            enum_type = field_info.enum_type
            
            # Determine if field is optional
            is_optional = field_info.is_optional or field_info.default_value not in [None, 'Ellipsis']
            
            if is_optional:
                lines.append(f"    @field_serializer('{field_info.name}')")
                lines.append(f"    def serialize_{field_info.name}(self, value: {enum_type} | None) -> str | None:")
                lines.append(f"        if value is None:")
                lines.append(f"            return None")
                lines.append(f"        return value.value if isinstance(value, {enum_type}) else value")
                lines.append("")
                lines.append(f"    @field_validator('{field_info.name}', mode='before')")
                lines.append(f"    @classmethod")
                lines.append(f"    def validate_{field_info.name}(cls, value):")
                lines.append(f"        if value is None:")
                lines.append(f"            return None")
                lines.append(f"        if isinstance(value, str):")
                lines.append(f"            return {enum_type}(value)")
                lines.append(f"        return value")
                lines.append("")
            else:
                lines.append(f"    @field_serializer('{field_info.name}')")
                lines.append(f"    def serialize_{field_info.name}(self, value: {enum_type}) -> str:")
                lines.append(f"        return value.value if isinstance(value, {enum_type}) else value")
                lines.append("")
                lines.append(f"    @field_validator('{field_info.name}', mode='before')")
                lines.append(f"    @classmethod")
                lines.append(f"    def validate_{field_info.name}(cls, value):")
                lines.append(f"        if isinstance(value, str):")
                lines.append(f"            return {enum_type}(value)")
                lines.append(f"        return value")
                lines.append("")
    
    return "\n".join(lines)


def generate_update_schema(mind_type: MindTypeInfo, enums: dict[str, EnumInfo]) -> str:
    """
    Generate MindUpdate schema code for a Mind type.
    
    Args:
        mind_type: MindTypeInfo object
        enums: Dictionary of enum definitions
        
    Returns:
        Generated schema code as string
    """
    base_fields = get_base_fields()
    
    # Filter out auto-generated fields
    update_fields = [f for f in mind_type.fields if f.name not in base_fields]
    
    lines = [
        f"class {mind_type.name}Update(BaseModel):",
        f'    """Schema for updating a {mind_type.name}. All fields are optional."""',
        ""
    ]
    
    # All fields are optional in update schema
    for field_info in update_fields:
        type_str = field_info.type_annotation
        lines.append(f"    {field_info.name}: {type_str} | None = None")
    
    # Add enum serializers and validators (track to avoid duplicates)
    enum_fields = [f for f in update_fields if f.is_enum]
    added_serializers = set()
    
    if enum_fields:
        lines.append("")
        for field_info in enum_fields:
            # Skip if we already added serializer for this field name
            if field_info.name in added_serializers:
                continue
            added_serializers.add(field_info.name)
            
            enum_type = field_info.enum_type
            lines.append(f"    @field_serializer('{field_info.name}')")
            lines.append(f"    def serialize_{field_info.name}(self, value: {enum_type} | None) -> str | None:")
            lines.append(f"        if value is None:")
            lines.append(f"            return None")
            lines.append(f"        return value.value if isinstance(value, {enum_type}) else value")
            lines.append("")
            lines.append(f"    @field_validator('{field_info.name}', mode='before')")
            lines.append(f"    @classmethod")
            lines.append(f"    def validate_{field_info.name}(cls, value):")
            lines.append(f"        if value is None:")
            lines.append(f"            return None")
            lines.append(f"        if isinstance(value, str):")
            lines.append(f"            return {enum_type}(value)")
            lines.append(f"        return value")
            lines.append("")
    
    return "\n".join(lines)


def generate_response_schema(mind_type: MindTypeInfo, enums: dict[str, EnumInfo]) -> str:
    """
    Generate MindResponse schema code for a Mind type.
    
    Args:
        mind_type: MindTypeInfo object
        enums: Dictionary of enum definitions
        
    Returns:
        Generated schema code as string
    """
    lines = [
        f"class {mind_type.name}Response(BaseModel):",
        f'    """Schema for {mind_type.name} responses."""',
        ""
    ]
    
    # Include all fields
    for field_info in mind_type.fields:
        type_str = field_info.type_annotation
        
        # Response includes all fields, respecting their optionality
        is_required = (field_info.default_value == 'Ellipsis' or 
                      field_info.default_value is None and not field_info.is_optional)
        
        if is_required and not field_info.is_optional:
            lines.append(f"    {field_info.name}: {type_str}")
        else:
            lines.append(f"    {field_info.name}: {type_str} | None = None")
    
    # Add enum serializers and validators (track to avoid duplicates)
    enum_fields = [f for f in mind_type.fields if f.is_enum]
    added_serializers = set()
    
    if enum_fields:
        lines.append("")
        for field_info in enum_fields:
            # Skip if we already added serializer for this field name
            if field_info.name in added_serializers:
                continue
            added_serializers.add(field_info.name)
            
            enum_type = field_info.enum_type
            
            # Determine if field is optional
            is_optional = field_info.is_optional or field_info.default_value not in [None, 'Ellipsis']
            
            if is_optional:
                lines.append(f"    @field_serializer('{field_info.name}')")
                lines.append(f"    def serialize_{field_info.name}(self, value: {enum_type} | None) -> str | None:")
                lines.append(f"        if value is None:")
                lines.append(f"            return None")
                lines.append(f"        return value.value if isinstance(value, {enum_type}) else value")
                lines.append("")
                lines.append(f"    @field_validator('{field_info.name}', mode='before')")
                lines.append(f"    @classmethod")
                lines.append(f"    def validate_{field_info.name}(cls, value):")
                lines.append(f"        if value is None:")
                lines.append(f"            return None")
                lines.append(f"        if isinstance(value, str):")
                lines.append(f"            return {enum_type}(value)")
                lines.append(f"        return value")
                lines.append("")
            else:
                lines.append(f"    @field_serializer('{field_info.name}')")
                lines.append(f"    def serialize_{field_info.name}(self, value: {enum_type}) -> str:")
                lines.append(f"        return value.value if isinstance(value, {enum_type}) else value")
                lines.append("")
                lines.append(f"    @field_validator('{field_info.name}', mode='before')")
                lines.append(f"    @classmethod")
                lines.append(f"    def validate_{field_info.name}(cls, value):")
                lines.append(f"        if isinstance(value, str):")
                lines.append(f"            return {enum_type}(value)")
                lines.append(f"        return value")
                lines.append("")
    
    return "\n".join(lines)


def generate_schemas_file(mind_types: dict[str, MindTypeInfo], enums: dict[str, EnumInfo]) -> str:
    """
    Generate the complete schemas file content.
    
    Args:
        mind_types: Dictionary of Mind type definitions
        enums: Dictionary of enum definitions
        
    Returns:
        Complete file content as string
    """
    lines = [
        '"""',
        'Auto-generated Pydantic schemas for Mind types.',
        '',
        'This file is generated by scripts/generate_schemas.py.',
        'DO NOT EDIT MANUALLY - changes will be overwritten.',
        '',
        '**Validates: Requirement 1 (Schema Auto-Generation from Data Model)**',
        '"""',
        '',
        'from datetime import date, datetime',
        'from uuid import UUID',
        'from typing import Optional',
        '',
        'from pydantic import BaseModel, EmailStr, field_serializer, field_validator',
        '',
        'from ..models.enums import (',
        '    StatusEnum,',
        '    PriorityEnum,',
        '    SeverityEnum,',
        '    ProbabilityEnum,',
        '    ResourceType,',
        '    AccountType,',
        '    TaskType,',
        '    RequirementType,',
        ')',
        '',
        ''
    ]
    
    # Generate schemas for each Mind type
    for mind_type_name in sorted(mind_types.keys()):
        mind_type = mind_types[mind_type_name]
        
        # Create schema
        lines.append(generate_create_schema(mind_type, enums))
        lines.append('')
        lines.append('')
        
        # Update schema
        lines.append(generate_update_schema(mind_type, enums))
        lines.append('')
        lines.append('')
        
        # Response schema
        lines.append(generate_response_schema(mind_type, enums))
        lines.append('')
        lines.append('')
    
    return '\n'.join(lines)


def main():
    """Main entry point for the schema generator."""
    # Determine paths
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    models_dir = backend_dir / "src" / "models"
    schemas_dir = backend_dir / "src" / "schemas"
    
    mind_file = models_dir / "mind.py"
    mind_types_file = models_dir / "mind_types.py"
    enums_file = models_dir / "enums.py"
    output_file = schemas_dir / "minds.py"
    
    print("Schema Generator for Mind-Based Data Model")
    print("=" * 50)
    print(f"Parsing: {mind_file}")
    print(f"Parsing: {mind_types_file}")
    print(f"Parsing: {enums_file}")
    print(f"Output:  {output_file}")
    print()
    
    # Parse BaseMind fields
    print("Parsing BaseMind fields...")
    base_fields = parse_base_mind_fields(mind_file)
    print(f"Found {len(base_fields)} BaseMind fields: {', '.join(f.name for f in base_fields)}")
    print()
    
    # Parse data model files
    print("Parsing Mind types...")
    mind_types = parse_mind_types(mind_types_file, base_fields)
    print(f"Found {len(mind_types)} Mind types: {', '.join(sorted(mind_types.keys()))}")
    print()
    
    print("Parsing enums...")
    enums = parse_enums(enums_file)
    print(f"Found {len(enums)} enums: {', '.join(sorted(enums.keys()))}")
    print()
    
    # Generate schemas
    print("Generating schemas...")
    schemas_content = generate_schemas_file(mind_types, enums)
    
    # Write to output file
    print(f"Writing to {output_file}...")
    with open(output_file, 'w') as f:
        f.write(schemas_content)
    
    print()
    print("✓ Schema generation complete!")
    print(f"✓ Generated {len(mind_types) * 3} schemas (Create, Update, Response for each type)")
    print()
    print("Next steps:")
    print("  1. Review the generated schemas in src/schemas/minds.py")
    print("  2. Run tests to verify the schemas work correctly")
    print("  3. Update API routes to use the new schemas")


if __name__ == "__main__":
    main()
