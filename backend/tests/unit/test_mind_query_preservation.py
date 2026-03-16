"""Preservation unit tests for Mind query endpoint.

These tests capture the baseline behavior on UNFIXED code for queries using
only existing parameters (mind_type, single status, creator, single tag).
They ensure the fix doesn't break existing filtering functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
"""

import pytest
from fastapi.testclient import TestClient

from src.app import app
from src.models.enums import StatusEnum

client = TestClient(app)

pytestmark = pytest.mark.usefixtures("clean_database")


@pytest.fixture
def sample_minds():
    """Create sample Mind nodes for testing preservation behavior."""
    minds = []
    
    # Create project minds with different statuses and tags
    project1 = {
        "mind_type": "project",
        "title": "Project Alpha",
        "description": "First project",
        "creator": "user123",
        "status": "active",
        "tags": ["tag1", "tag2"],
        "type_specific_attributes": {
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
        },
    }
    response = client.post("/api/v1/minds", json=project1)
    minds.append(response.json())
    
    project2 = {
        "mind_type": "project",
        "title": "Project Beta",
        "description": "Second project",
        "creator": "user456",
        "status": "draft",
        "tags": ["tag2", "tag3"],
        "type_specific_attributes": {
            "start_date": "2024-02-01",
            "end_date": "2024-11-30",
        },
    }
    response = client.post("/api/v1/minds", json=project2)
    minds.append(response.json())
    
    # Create task minds
    task1 = {
        "mind_type": "task",
        "title": "Task One",
        "description": "First task",
        "creator": "user123",
        "status": "active",
        "tags": ["tag1"],
        "type_specific_attributes": {
            "priority": "high",
            "due_date": "2024-03-01",
        },
    }
    response = client.post("/api/v1/minds", json=task1)
    minds.append(response.json())
    
    task2 = {
        "mind_type": "task",
        "title": "Task Two",
        "description": "Second task",
        "creator": "user456",
        "status": "archived",
        "tags": ["tag3"],
        "type_specific_attributes": {
            "priority": "low",
            "due_date": "2024-04-01",
        },
    }
    response = client.post("/api/v1/minds", json=task2)
    minds.append(response.json())
    
    return minds


def test_mind_type_filtering_preservation(sample_minds):
    """Test that mind_type filtering continues to work exactly as before.
    
    **Validates: Requirement 3.1**
    
    GET /api/v1/minds?mind_type=project should return only project minds.
    """
    response = client.get("/api/v1/minds?mind_type=project")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "items" in data
    assert "total" in data
    
    # Verify only project minds are returned
    assert len(data["items"]) == 2
    for item in data["items"]:
        assert item["mind_type"] == "project"
    
    # Verify total count
    assert data["total"] == 2


def test_single_status_filtering_preservation(sample_minds):
    """Test that single status filtering continues to work exactly as before.
    
    **Validates: Requirement 3.2**
    
    GET /api/v1/minds?status=active should return only active minds.
    """
    response = client.get("/api/v1/minds?status=active")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "items" in data
    assert "total" in data
    
    # Verify only active minds are returned
    assert len(data["items"]) == 2
    for item in data["items"]:
        assert item["status"] == "active"
    
    # Verify total count
    assert data["total"] == 2


def test_creator_filtering_preservation(sample_minds):
    """Test that creator filtering continues to work exactly as before.
    
    **Validates: Requirement 3.3**
    
    GET /api/v1/minds?creator=user123 should return only minds by user123.
    """
    response = client.get("/api/v1/minds?creator=user123")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "items" in data
    assert "total" in data
    
    # Verify only minds by user123 are returned
    assert len(data["items"]) == 2
    for item in data["items"]:
        assert item["creator"] == "user123"
    
    # Verify total count
    assert data["total"] == 2


def test_no_filters_returns_all_minds_preservation(sample_minds):
    """Test that querying without filters returns all minds.
    
    **Validates: Requirement 3.4**
    
    GET /api/v1/minds should return all Mind nodes (latest versions only).
    """
    response = client.get("/api/v1/minds")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "items" in data
    assert "total" in data
    
    # Verify all minds are returned
    assert len(data["items"]) == 4
    assert data["total"] == 4


def test_query_result_structure_preservation(sample_minds):
    """Test that QueryResult includes items and total fields.
    
    **Validates: Requirement 3.5**
    
    The QueryResult should continue to include items and total fields.
    """
    response = client.get("/api/v1/minds")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify required fields are present
    assert "items" in data
    assert "total" in data
    
    # Verify items is a list
    assert isinstance(data["items"], list)
    
    # Verify total is an integer
    assert isinstance(data["total"], int)


def test_combined_filters_and_logic_preservation(sample_minds):
    """Test that multiple filters are combined with AND logic.
    
    **Validates: Requirement 3.6**
    
    GET /api/v1/minds?mind_type=project&status=active should apply AND logic.
    """
    response = client.get("/api/v1/minds?mind_type=project&status=active")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "items" in data
    assert "total" in data
    
    # Verify only minds matching BOTH filters are returned
    assert len(data["items"]) == 1
    for item in data["items"]:
        assert item["mind_type"] == "project"
        assert item["status"] == "active"
    
    # Verify total count
    assert data["total"] == 1


def test_latest_version_only_preservation(sample_minds):
    """Test that only the latest version of each Mind node is returned.
    
    **Validates: Requirement 3.7**
    
    When a Mind is updated, only the latest version should appear in query results.
    """
    # Get the first mind
    first_mind = sample_minds[0]
    uuid = first_mind["uuid"]
    
    # Update the mind to create a new version
    update_data = {"title": "Updated Title"}
    update_response = client.put(f"/api/v1/minds/{uuid}", json=update_data)
    assert update_response.status_code == 200
    updated_mind = update_response.json()
    
    # Verify version was incremented
    assert updated_mind["version"] == first_mind["version"] + 1
    
    # Query all minds
    response = client.get("/api/v1/minds")
    assert response.status_code == 200
    data = response.json()
    
    # Verify only 4 minds are returned (not 5, even though we created a new version)
    assert len(data["items"]) == 4
    assert data["total"] == 4
    
    # Verify the returned mind has the latest version
    matching_minds = [m for m in data["items"] if m["uuid"] == uuid]
    assert len(matching_minds) == 1
    assert matching_minds[0]["version"] == updated_mind["version"]
    assert matching_minds[0]["title"] == "Updated Title"
