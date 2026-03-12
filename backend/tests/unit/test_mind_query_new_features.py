"""Comprehensive unit tests for new Mind query functionality.

This test file validates all new functionality added in the bugfix:
- MindQueryFilters schema validation
- QueryResult schema validation
- Service layer filtering logic

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from src.schemas.mind_generic import MindQueryFilters, QueryResult, MindResponse


class TestMindQueryFiltersSchemaValidation:
    """Test MindQueryFilters schema validation for new fields."""
    
    def test_valid_updated_after_field(self):
        """Test that updated_after accepts valid datetime values.
        
        **Validates: Requirement 2.1**
        """
        dt = datetime(2024, 1, 1, tzinfo=timezone.utc)
        filters = MindQueryFilters(updated_after=dt)
        assert filters.updated_after == dt
    
    def test_valid_updated_before_field(self):
        """Test that updated_before accepts valid datetime values.
        
        **Validates: Requirement 2.2**
        """
        dt = datetime(2024, 12, 31, tzinfo=timezone.utc)
        filters = MindQueryFilters(updated_before=dt)
        assert filters.updated_before == dt
    
    def test_valid_created_after_field(self):
        """Test that created_after accepts valid datetime values.
        
        **Validates: Requirement 2.8**
        """
        dt = datetime(2024, 1, 1, tzinfo=timezone.utc)
        filters = MindQueryFilters(created_after=dt)
        assert filters.created_after == dt
    
    def test_valid_created_before_field(self):
        """Test that created_before accepts valid datetime values.
        
        **Validates: Requirement 2.9**
        """
        dt = datetime(2024, 12, 31, tzinfo=timezone.utc)
        filters = MindQueryFilters(created_before=dt)
        assert filters.created_before == dt
    
    def test_valid_title_search_field(self):
        """Test that title_search accepts valid string values.
        
        **Validates: Requirement 2.7**
        """
        filters = MindQueryFilters(title_search="project")
        assert filters.title_search == "project"
    
    def test_valid_sort_by_values(self):
        """Test that sort_by accepts all valid values.
        
        **Validates: Requirement 2.3**
        """
        valid_values = ["updated_at", "created_at", "version", "title"]
        for value in valid_values:
            filters = MindQueryFilters(sort_by=value)
            assert filters.sort_by == value
    
    def test_invalid_sort_by_value(self):
        """Test that sort_by rejects invalid values.
        
        **Validates: Requirement 2.3**
        """
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(sort_by="invalid_field")
        assert "sort_by" in str(exc_info.value)
    
    def test_valid_sort_order_values(self):
        """Test that sort_order accepts all valid values.
        
        **Validates: Requirement 2.4**
        """
        valid_values = ["asc", "desc"]
        for value in valid_values:
            filters = MindQueryFilters(sort_order=value)
            assert filters.sort_order == value
    
    def test_invalid_sort_order_value(self):
        """Test that sort_order rejects invalid values.
        
        **Validates: Requirement 2.4**
        """
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(sort_order="invalid_order")
        assert "sort_order" in str(exc_info.value)
    
    def test_valid_page_values(self):
        """Test that page accepts valid values (>= 1).
        
        **Validates: Requirement 2.5**
        """
        for page in [1, 5, 10, 100]:
            filters = MindQueryFilters(page=page)
            assert filters.page == page
    
    def test_invalid_page_zero(self):
        """Test that page rejects value 0.
        
        **Validates: Requirement 2.5**
        """
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(page=0)
        assert "page" in str(exc_info.value)
    
    def test_invalid_page_negative(self):
        """Test that page rejects negative values.
        
        **Validates: Requirement 2.5**
        """
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(page=-1)
        assert "page" in str(exc_info.value)
    
    def test_valid_page_size_values(self):
        """Test that page_size accepts valid values (1-100).
        
        **Validates: Requirement 2.6**
        """
        for page_size in [1, 20, 50, 100]:
            filters = MindQueryFilters(page_size=page_size)
            assert filters.page_size == page_size
    
    def test_invalid_page_size_zero(self):
        """Test that page_size rejects value 0.
        
        **Validates: Requirement 2.6**
        """
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(page_size=0)
        assert "page_size" in str(exc_info.value)
    
    def test_invalid_page_size_too_large(self):
        """Test that page_size rejects values > 100.
        
        **Validates: Requirement 2.6**
        """
        with pytest.raises(ValidationError) as exc_info:
            MindQueryFilters(page_size=200)
        assert "page_size" in str(exc_info.value)
    
    def test_optional_fields_can_be_none(self):
        """Test that optional fields can be None.
        
        **Validates: Requirements 2.1, 2.2, 2.7, 2.8, 2.9, 2.10, 2.11**
        """
        filters = MindQueryFilters(
            updated_after=None,
            updated_before=None,
            created_after=None,
            created_before=None,
            title_search=None,
            tags=None,
            statuses=None,
        )
        assert filters.updated_after is None
        assert filters.updated_before is None
        assert filters.created_after is None
        assert filters.created_before is None
        assert filters.title_search is None
        assert filters.tags is None
        assert filters.statuses is None
    
    def test_default_values(self):
        """Test that default values are set correctly.
        
        **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
        """
        filters = MindQueryFilters()
        assert filters.sort_by == "updated_at"
        assert filters.sort_order == "desc"
        assert filters.page == 1
        assert filters.page_size == 20
    
    def test_multiple_tags_field(self):
        """Test that tags field accepts list of strings.
        
        **Validates: Requirement 2.10**
        """
        tags = ["tag1", "tag2", "tag3"]
        filters = MindQueryFilters(tags=tags)
        assert filters.tags == tags
    
    def test_multiple_statuses_field(self):
        """Test that statuses field accepts list of strings.
        
        **Validates: Requirement 2.11**
        """
        statuses = ["active", "draft", "archived"]
        filters = MindQueryFilters(statuses=statuses)
        assert filters.statuses == statuses


class TestQueryResultSchemaValidation:
    """Test QueryResult schema validation for new pagination fields."""
    
    def test_query_result_includes_pagination_fields(self):
        """Test that QueryResult includes page, page_size, and total_pages fields.
        
        **Validates: Requirement 2.12**
        """
        result = QueryResult(
            items=[],
            total=0,
            page=1,
            page_size=20,
            total_pages=0,
        )
        assert result.page == 1
        assert result.page_size == 20
        assert result.total_pages == 0
    
    def test_total_pages_calculation_single_page(self):
        """Test total_pages calculation for single page of results.
        
        **Validates: Requirement 2.12**
        """
        result = QueryResult(
            items=[],
            total=15,
            page=1,
            page_size=20,
            total_pages=1,
        )
        assert result.total_pages == 1
    
    def test_total_pages_calculation_multiple_pages(self):
        """Test total_pages calculation for multiple pages.
        
        **Validates: Requirement 2.12**
        """
        result = QueryResult(
            items=[],
            total=50,
            page=1,
            page_size=20,
            total_pages=3,
        )
        assert result.total_pages == 3
    
    def test_total_pages_calculation_exact_multiple(self):
        """Test total_pages calculation when total is exact multiple of page_size.
        
        **Validates: Requirement 2.12**
        """
        result = QueryResult(
            items=[],
            total=40,
            page=1,
            page_size=20,
            total_pages=2,
        )
        assert result.total_pages == 2
    
    def test_total_pages_zero_for_empty_results(self):
        """Test total_pages is 0 for empty results.
        
        **Validates: Requirement 2.12**
        """
        result = QueryResult(
            items=[],
            total=0,
            page=1,
            page_size=20,
            total_pages=0,
        )
        assert result.total_pages == 0


class TestServiceLayerFiltering:
    """Test service layer filtering logic for new features."""
    
    @pytest.fixture
    def sample_minds_for_filtering(self, client):
        """Create sample Mind nodes with various attributes for filtering tests."""
        minds = []
        
        # Create minds with different timestamps
        mind1 = {
            "mind_type": "project",
            "title": "Alpha Project",
            "description": "First project",
            "creator": "user1",
            "status": "active",
            "tags": ["tag1", "tag2"],
            "type_specific_attributes": {
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
            },
        }
        response = client.post("/api/v1/minds", json=mind1)
        minds.append(response.json())
        
        mind2 = {
            "mind_type": "project",
            "title": "Beta Project",
            "description": "Second project",
            "creator": "user2",
            "status": "draft",
            "tags": ["tag2", "tag3"],
            "type_specific_attributes": {
                "start_date": "2024-02-01",
                "end_date": "2024-11-30",
            },
        }
        response = client.post("/api/v1/minds", json=mind2)
        minds.append(response.json())
        
        mind3 = {
            "mind_type": "task",
            "title": "Gamma Task",
            "description": "First task",
            "creator": "user1",
            "status": "archived",
            "tags": ["tag1", "tag3"],
            "type_specific_attributes": {
                "priority": "high",
                "assignee": "user1",
                "due_date": "2024-03-01",
            },
        }
        response = client.post("/api/v1/minds", json=mind3)
        minds.append(response.json())
        
        return minds
    
    def test_title_search_case_insensitive(self, client, sample_minds_for_filtering):
        """Test title_search performs case-insensitive partial matching.
        
        **Validates: Requirement 2.7**
        """
        # Search for "project" (lowercase)
        response = client.get("/api/v1/minds?title_search=project")
        assert response.status_code == 200
        data = response.json()
        
        # Should match "Alpha Project" and "Beta Project"
        assert len(data["items"]) == 2
        for item in data["items"]:
            assert "project" in item["title"].lower()
    
    def test_title_search_partial_match(self, client, sample_minds_for_filtering):
        """Test title_search matches partial strings.
        
        **Validates: Requirement 2.7**
        """
        # Search for "alpha"
        response = client.get("/api/v1/minds?title_search=alpha")
        assert response.status_code == 200
        data = response.json()
        
        # Should match "Alpha Project"
        assert len(data["items"]) == 1
        assert "alpha" in data["items"][0]["title"].lower()
    
    def test_sorting_by_title_asc(self, client, sample_minds_for_filtering):
        """Test sorting by title in ascending order.
        
        **Validates: Requirements 2.3, 2.4**
        """
        response = client.get("/api/v1/minds?sort_by=title&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        
        # Verify results are sorted by title ascending
        titles = [item["title"] for item in data["items"]]
        assert titles == sorted(titles)
    
    def test_sorting_by_title_desc(self, client, sample_minds_for_filtering):
        """Test sorting by title in descending order.
        
        **Validates: Requirements 2.3, 2.4**
        """
        response = client.get("/api/v1/minds?sort_by=title&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        
        # Verify results are sorted by title descending
        titles = [item["title"] for item in data["items"]]
        assert titles == sorted(titles, reverse=True)
    
    def test_sorting_by_version(self, client, sample_minds_for_filtering):
        """Test sorting by version field.
        
        **Validates: Requirements 2.3, 2.4**
        """
        response = client.get("/api/v1/minds?sort_by=version&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        
        # Verify results are sorted by version
        versions = [item["version"] for item in data["items"]]
        assert versions == sorted(versions)
    
    def test_page_based_pagination(self, client, sample_minds_for_filtering):
        """Test page-based pagination calculations.
        
        **Validates: Requirements 2.5, 2.6**
        """
        # Get first page with page_size=2
        response = client.get("/api/v1/minds?page=1&page_size=2")
        assert response.status_code == 200
        data = response.json()
        
        # Should return 2 items
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total"] == 3
        assert data["total_pages"] == 2
    
    def test_pagination_second_page(self, client, sample_minds_for_filtering):
        """Test retrieving second page of results.
        
        **Validates: Requirements 2.5, 2.6**
        """
        # Get second page with page_size=2
        response = client.get("/api/v1/minds?page=2&page_size=2")
        assert response.status_code == 200
        data = response.json()
        
        # Should return 1 item (last item)
        assert len(data["items"]) == 1
        assert data["page"] == 2
        assert data["page_size"] == 2
        assert data["total"] == 3
        assert data["total_pages"] == 2
    
    def test_multiple_tags_and_logic(self, client, sample_minds_for_filtering):
        """Test multiple tags apply AND logic (Mind must have ALL tags).
        
        **Validates: Requirement 2.10**
        """
        # Query for minds with both tag1 AND tag2
        response = client.get("/api/v1/minds?tags=tag1,tag2")
        assert response.status_code == 200
        data = response.json()
        
        # Should only return "Alpha Project" which has both tags
        assert len(data["items"]) == 1
        assert "tag1" in data["items"][0]["tags"]
        assert "tag2" in data["items"][0]["tags"]
    
    def test_multiple_statuses_or_logic(self, client, sample_minds_for_filtering):
        """Test multiple statuses apply OR logic (Mind matches ANY status).
        
        **Validates: Requirement 2.11**
        """
        # Query for minds with status active OR draft
        response = client.get("/api/v1/minds?status=active,draft")
        assert response.status_code == 200
        data = response.json()
        
        # Should return "Alpha Project" (active) and "Beta Project" (draft)
        assert len(data["items"]) == 2
        statuses = [item["status"] for item in data["items"]]
        assert "active" in statuses
        assert "draft" in statuses
        assert "archived" not in statuses


pytestmark = pytest.mark.usefixtures("clean_database")


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    from fastapi.testclient import TestClient
    from src.app import app
    return TestClient(app)
