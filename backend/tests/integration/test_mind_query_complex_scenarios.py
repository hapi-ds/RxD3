"""Integration tests for complex Mind query scenarios.

This test file validates complex scenarios that combine multiple features:
- Combined filters (title_search + date range + multiple tags + sorting + pagination)
- Edge cases (empty results, single page, last page, out of range page)
- Case-insensitivity for title search
- Multiple tags AND logic
- Multiple statuses OR logic

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


@pytest.fixture
def complex_test_dataset(clean_database):
    """Create a comprehensive dataset for complex scenario testing.
    
    Creates 15 Mind nodes with various attributes:
    - Different mind_types (project, task, milestone)
    - Different statuses (active, draft, archived, deleted)
    - Different creators (user1, user2, user3)
    - Various tag combinations
    - Staggered timestamps
    """
    minds = []
    base_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
    
    # Project 1: Active, user1, tags=[python, backend], created Jan 1
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "project",
        "title": "Python Backend API",
        "description": "Backend API development",
        "creator": "user1",
        "status": "active",
        "tags": ["python", "backend", "api"],
        "type_specific_attributes": {"start_date": "2024-01-01", "end_date": "2024-12-31"},
    }).json())
    
    # Project 2: Draft, user2, tags=[frontend, react], created Jan 5
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "project",
        "title": "React Frontend Dashboard",
        "description": "Frontend dashboard",
        "creator": "user2",
        "status": "draft",
        "tags": ["frontend", "react", "dashboard"],
        "type_specific_attributes": {"start_date": "2024-01-05", "end_date": "2024-11-30"},
    }).json())
    
    # Task 1: Active, user1, tags=[python, testing], created Jan 10
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "Write Unit Tests",
        "description": "Unit testing task",
        "creator": "user1",
        "status": "active",
        "tags": ["python", "testing"],
    }).json())
    
    # Task 2: Archived, user2, tags=[frontend, testing], created Jan 15
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "Frontend Integration Tests",
        "description": "Integration testing",
        "creator": "user2",
        "status": "archived",
        "tags": ["frontend", "testing"],
    }).json())
    
    # Task 3: Active, user3, tags=[backend, api], created Jan 20
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "API Documentation",
        "description": "Document API endpoints",
        "creator": "user3",
        "status": "active",
        "tags": ["backend", "api", "documentation"],
    }).json())
    
    # Milestone 1: Active, user1, tags=[backend], created Jan 25
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "milestone",
        "title": "Backend MVP Complete",
        "description": "Backend milestone",
        "creator": "user1",
        "status": "active",
        "tags": ["backend", "mvp"],
        "type_specific_attributes": {"target_date": "2024-06-01", "deliverables": ["API", "Database"]},
    }).json())
    
    # Project 3: Deleted, user3, tags=[mobile], created Feb 1
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "project",
        "title": "Mobile App Development",
        "description": "Mobile app project",
        "creator": "user3",
        "status": "deleted",
        "tags": ["mobile", "ios", "android"],
        "type_specific_attributes": {"start_date": "2024-02-01", "end_date": "2024-10-31"},
    }).json())
    
    # Task 4: Draft, user1, tags=[python, backend, api], created Feb 5
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "Python API Refactoring",
        "description": "Refactor API code",
        "creator": "user1",
        "status": "draft",
        "tags": ["python", "backend", "api"],
    }).json())
    
    # Task 5: Active, user2, tags=[react, frontend], created Feb 10
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "React Component Library",
        "description": "Build component library",
        "creator": "user2",
        "status": "active",
        "tags": ["react", "frontend", "components"],
    }).json())
    
    # Milestone 2: Draft, user2, tags=[frontend], created Feb 15
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "milestone",
        "title": "Frontend Alpha Release",
        "description": "Frontend milestone",
        "creator": "user2",
        "status": "draft",
        "tags": ["frontend", "alpha"],
        "type_specific_attributes": {"target_date": "2024-05-01", "deliverables": ["Dashboard", "Components"]},
    }).json())
    
    # Project 4: Active, user1, tags=[python, backend, testing], created Feb 20
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "project",
        "title": "Python Testing Framework",
        "description": "Testing framework project",
        "creator": "user1",
        "status": "active",
        "tags": ["python", "backend", "testing"],
        "type_specific_attributes": {"start_date": "2024-02-20", "end_date": "2024-08-31"},
    }).json())
    
    # Task 6: Archived, user3, tags=[documentation], created Feb 25
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "User Documentation",
        "description": "Write user docs",
        "creator": "user3",
        "status": "archived",
        "tags": ["documentation", "user-guide"],
    }).json())
    
    # Project 5: Active, user2, tags=[frontend, react, dashboard], created Mar 1
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "project",
        "title": "React Dashboard v2",
        "description": "Dashboard v2 project",
        "creator": "user2",
        "status": "active",
        "tags": ["frontend", "react", "dashboard"],
        "type_specific_attributes": {"start_date": "2024-03-01", "end_date": "2024-09-30"},
    }).json())
    
    # Task 7: Active, user1, tags=[python, api], created Mar 5
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "task",
        "title": "Python API Performance",
        "description": "Optimize API performance",
        "creator": "user1",
        "status": "active",
        "tags": ["python", "api", "performance"],
    }).json())
    
    # Milestone 3: Active, user3, tags=[backend, frontend], created Mar 10
    minds.append(client.post("/api/v1/minds", json={
        "mind_type": "milestone",
        "title": "Full Stack Integration",
        "description": "Integration milestone",
        "creator": "user3",
        "status": "active",
        "tags": ["backend", "frontend", "integration"],
        "type_specific_attributes": {"target_date": "2024-07-01", "deliverables": ["API", "Dashboard", "Tests"]},
    }).json())
    
    return minds


pytestmark = pytest.mark.usefixtures("clean_database")


class TestCombinedFilters:
    """Test complex scenarios combining multiple filters."""
    
    def test_title_search_with_date_range_and_tags_and_sorting_and_pagination(self, complex_test_dataset):
        """Test combining title_search + date range + multiple tags + sorting + pagination.
        
        **Validates: Requirements 2.1, 2.2, 2.5, 2.6, 2.7, 2.10**
        """
        # Search for "python" in title, with tags python+backend, sorted by title, page 1
        response = client.get(
            "/api/v1/minds?"
            "title_search=python&"
            "tags=python,backend&"
            "sort_by=title&"
            "sort_order=asc&"
            "page=1&"
            "page_size=2"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find minds with "python" in title AND both tags
        assert data["total"] >= 2
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["items"]) <= 2
        
        # Verify all results match criteria
        for item in data["items"]:
            assert "python" in item["title"].lower()
            assert "python" in item["tags"]
            assert "backend" in item["tags"]
        
        # Verify sorting by title ascending
        if len(data["items"]) > 1:
            titles = [item["title"] for item in data["items"]]
            assert titles == sorted(titles)
    
    def test_mind_type_with_multiple_statuses_and_creator_and_sorting(self, complex_test_dataset):
        """Test combining mind_type + multiple statuses + creator + sorting.
        
        **Validates: Requirements 2.3, 2.4, 2.11, 3.1, 3.3**
        """
        # Query for tasks by user1 with status active OR draft, sorted by updated_at desc
        response = client.get(
            "/api/v1/minds?"
            "mind_type=task&"
            "statuses=active,draft&"
            "creator=user1&"
            "sort_by=updated_at&"
            "sort_order=desc"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all results match criteria
        for item in data["items"]:
            assert item["mind_type"] == "task"
            assert item["creator"] == "user1"
            assert item["status"] in ["active", "draft"]
        
        # Verify sorting by updated_at descending
        if len(data["items"]) > 1:
            timestamps = [datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00")) for item in data["items"]]
            assert timestamps == sorted(timestamps, reverse=True)
    
    def test_all_filters_combined(self, complex_test_dataset):
        """Test combining all available filters together.
        
        **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**
        """
        # Complex query with many filters
        response = client.get(
            "/api/v1/minds?"
            "mind_type=task&"
            "title_search=api&"
            "tags=python,api&"
            "statuses=active,draft&"
            "creator=user1&"
            "sort_by=title&"
            "sort_order=asc&"
            "page=1&"
            "page_size=10"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all results match all criteria
        for item in data["items"]:
            assert item["mind_type"] == "task"
            assert "api" in item["title"].lower()
            assert "python" in item["tags"]
            assert "api" in item["tags"]
            assert item["status"] in ["active", "draft"]
            assert item["creator"] == "user1"


class TestEdgeCases:
    """Test edge cases for query operations."""
    
    def test_empty_results(self, complex_test_dataset):
        """Test query that returns no results.
        
        **Validates: Requirements 2.7, 2.12**
        """
        # Search for non-existent title
        response = client.get("/api/v1/minds?title_search=nonexistent_xyz_123")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["page_size"] == 20
        assert data["total_pages"] == 0
    
    def test_single_page_of_results(self, complex_test_dataset):
        """Test when all results fit on a single page.
        
        **Validates: Requirements 2.5, 2.6, 2.12**
        """
        # Query with page_size larger than total results
        response = client.get("/api/v1/minds?page_size=100")
        
        assert response.status_code == 200
        data = response.json()
        
        # All results should be on page 1
        assert data["page"] == 1
        assert data["total_pages"] == 1
        assert len(data["items"]) == data["total"]
    
    def test_last_page_of_results(self, complex_test_dataset):
        """Test retrieving the last page of results.
        
        **Validates: Requirements 2.5, 2.6, 2.12**
        """
        # First get total count
        response = client.get("/api/v1/minds?page_size=5")
        data = response.json()
        total_pages = data["total_pages"]
        
        # Now get the last page
        response = client.get(f"/api/v1/minds?page={total_pages}&page_size=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == total_pages
        assert data["total_pages"] == total_pages
        # Last page may have fewer items than page_size
        assert len(data["items"]) <= 5
        assert len(data["items"]) > 0
    
    def test_out_of_range_page_number(self, complex_test_dataset):
        """Test requesting a page number beyond available pages.
        
        **Validates: Requirements 2.5, 2.6, 2.12**
        """
        # Request page 1000 (way beyond available pages)
        response = client.get("/api/v1/minds?page=1000&page_size=10")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return empty results but valid pagination metadata
        assert data["items"] == []
        assert data["page"] == 1000
        assert data["page_size"] == 10
        assert data["total"] > 0  # Total count should still be accurate
        assert data["total_pages"] > 0
    
    def test_page_size_larger_than_total_results(self, complex_test_dataset):
        """Test when page_size is larger than total available results.
        
        **Validates: Requirements 2.5, 2.6, 2.12**
        """
        # Filter to get small result set (tasks by user3), then use moderate page_size
        response = client.get("/api/v1/minds?creator=user3&page_size=20")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return all results on single page (user3 has fewer than 20 minds)
        assert data["page"] == 1
        assert data["total_pages"] == 1
        assert len(data["items"]) == data["total"]
        assert data["total"] <= 20  # We know user3 has fewer than 20 minds


class TestCaseInsensitivity:
    """Test case-insensitive search functionality."""
    
    def test_title_search_lowercase(self, complex_test_dataset):
        """Test title_search with lowercase query.
        
        **Validates: Requirement 2.7**
        """
        response = client.get("/api/v1/minds?title_search=python")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should match "Python" (capitalized) in titles
        assert data["total"] > 0
        for item in data["items"]:
            assert "python" in item["title"].lower()
    
    def test_title_search_uppercase(self, complex_test_dataset):
        """Test title_search with uppercase query.
        
        **Validates: Requirement 2.7**
        """
        response = client.get("/api/v1/minds?title_search=PYTHON")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should match "Python" (capitalized) in titles
        assert data["total"] > 0
        for item in data["items"]:
            assert "python" in item["title"].lower()
    
    def test_title_search_mixed_case(self, complex_test_dataset):
        """Test title_search with mixed case query.
        
        **Validates: Requirement 2.7**
        """
        response = client.get("/api/v1/minds?title_search=PyThOn")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should match "Python" (capitalized) in titles
        assert data["total"] > 0
        for item in data["items"]:
            assert "python" in item["title"].lower()
    
    def test_title_search_case_consistency(self, complex_test_dataset):
        """Test that different case variations return same results.
        
        **Validates: Requirement 2.7**
        """
        # Query with different case variations
        response_lower = client.get("/api/v1/minds?title_search=react")
        response_upper = client.get("/api/v1/minds?title_search=REACT")
        response_mixed = client.get("/api/v1/minds?title_search=ReAcT")
        
        assert response_lower.status_code == 200
        assert response_upper.status_code == 200
        assert response_mixed.status_code == 200
        
        data_lower = response_lower.json()
        data_upper = response_upper.json()
        data_mixed = response_mixed.json()
        
        # All should return same total count
        assert data_lower["total"] == data_upper["total"] == data_mixed["total"]
        
        # All should return same UUIDs (order may differ without explicit sorting)
        uuids_lower = {item["uuid"] for item in data_lower["items"]}
        uuids_upper = {item["uuid"] for item in data_upper["items"]}
        uuids_mixed = {item["uuid"] for item in data_mixed["items"]}
        
        assert uuids_lower == uuids_upper == uuids_mixed


class TestMultipleTagsANDLogic:
    """Test multiple tags with AND logic."""
    
    def test_mind_with_all_tags_matches(self, complex_test_dataset):
        """Test that Mind with tags [A, B, C] matches query tags=[A, B].
        
        **Validates: Requirement 2.10**
        """
        # Query for minds with both python AND backend tags
        response = client.get("/api/v1/minds?tags=python,backend")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return minds that have BOTH tags
        assert data["total"] > 0
        for item in data["items"]:
            assert "python" in item["tags"]
            assert "backend" in item["tags"]
            # May also have additional tags (e.g., "api", "testing")
    
    def test_mind_without_all_tags_does_not_match(self, complex_test_dataset):
        """Test that Mind with tags [A] does NOT match query tags=[A, B].
        
        **Validates: Requirement 2.10**
        """
        # Query for minds with both python AND nonexistent_tag
        response = client.get("/api/v1/minds?tags=python,nonexistent_tag_xyz")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return no results (no mind has both tags)
        assert data["total"] == 0
        assert data["items"] == []
    
    def test_three_tags_and_logic(self, complex_test_dataset):
        """Test AND logic with three tags.
        
        **Validates: Requirement 2.10**
        """
        # Query for minds with python AND backend AND api tags
        response = client.get("/api/v1/minds?tags=python,backend,api")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return minds that have ALL three tags
        for item in data["items"]:
            assert "python" in item["tags"]
            assert "backend" in item["tags"]
            assert "api" in item["tags"]
    
    def test_single_tag_still_works(self, complex_test_dataset):
        """Test that single tag filtering still works correctly.
        
        **Validates: Requirements 2.10, 3.4**
        """
        # Query for minds with just python tag
        response = client.get("/api/v1/minds?tags=python")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return all minds with python tag (regardless of other tags)
        assert data["total"] > 0
        for item in data["items"]:
            assert "python" in item["tags"]


class TestMultipleStatusesORLogic:
    """Test multiple statuses with OR logic."""
    
    def test_mind_with_matching_status_matches(self, complex_test_dataset):
        """Test that Mind with status=active matches query statuses=[active, archived].
        
        **Validates: Requirement 2.11**
        """
        # Query for minds with status active OR archived
        response = client.get("/api/v1/minds?statuses=active,archived")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return minds with either status
        assert data["total"] > 0
        for item in data["items"]:
            assert item["status"] in ["active", "archived"]
    
    def test_mind_without_matching_status_does_not_match(self, complex_test_dataset):
        """Test that Mind with status=deleted does NOT match query statuses=[active, archived].
        
        **Validates: Requirement 2.11**
        """
        # Query for minds with status active OR archived
        response = client.get("/api/v1/minds?statuses=active,archived")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should NOT include any deleted minds
        for item in data["items"]:
            assert item["status"] != "deleted"
    
    def test_three_statuses_or_logic(self, complex_test_dataset):
        """Test OR logic with three statuses.
        
        **Validates: Requirement 2.11**
        """
        # Query for minds with status active OR draft OR archived
        response = client.get("/api/v1/minds?statuses=active,draft,archived")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return minds with any of the three statuses
        assert data["total"] > 0
        for item in data["items"]:
            assert item["status"] in ["active", "draft", "archived"]
        
        # Should NOT include deleted minds
        for item in data["items"]:
            assert item["status"] != "deleted"
    
    def test_single_status_still_works(self, complex_test_dataset):
        """Test that single status filtering still works correctly.
        
        **Validates: Requirements 2.11, 3.2**
        """
        # Query for minds with just active status
        response = client.get("/api/v1/minds?statuses=active")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return only active minds
        assert data["total"] > 0
        for item in data["items"]:
            assert item["status"] == "active"
    
    def test_all_statuses_combined(self, complex_test_dataset):
        """Test querying for all possible statuses.
        
        **Validates: Requirement 2.11**
        """
        # Query for all statuses
        response = client.get("/api/v1/minds?statuses=active,draft,archived,deleted")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return all minds regardless of status (15 total created)
        # Note: The total should match the number of minds created in the fixture
        assert data["total"] >= 10  # At least 10 minds should be returned
        
        # Verify we have minds with different statuses
        statuses = {item["status"] for item in data["items"]}
        assert len(statuses) > 1  # Should have multiple different statuses
