"""Property-based test for Mind query schema mismatch bugfix.

This test validates that the query_minds endpoint accepts all query parameters
without crashing. This is a bug condition exploration test that MUST FAIL on
unfixed code to confirm the bug exists.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**
"""

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from hypothesis import given, strategies as st, settings, Phase

from src.models.enums import StatusEnum
from src.schemas.mind_generic import MindQueryFilters, QueryResult
from src.services.mind_service import MindService


# Strategy for generating valid datetime objects
def datetime_strategy():
    """Generate datetime objects for testing."""
    return st.datetimes(
        min_value=datetime(2020, 1, 1),
        max_value=datetime(2025, 12, 31),
    ).map(lambda dt: dt.replace(tzinfo=timezone.utc))


# Strategy for generating valid sort_by values
sort_by_strategy = st.sampled_from(["updated_at", "created_at", "version", "title"])

# Strategy for generating valid sort_order values
sort_order_strategy = st.sampled_from(["asc", "desc"])

# Strategy for generating valid page numbers
page_strategy = st.integers(min_value=1, max_value=10)

# Strategy for generating valid page_size values
page_size_strategy = st.integers(min_value=1, max_value=100)

# Strategy for generating title search strings
title_search_strategy = st.text(min_size=1, max_size=50, alphabet=st.characters(
    whitelist_categories=("Lu", "Ll", "Nd"), whitelist_characters=" -_"
))

# Strategy for generating tag lists
tags_strategy = st.lists(
    st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=("Lu", "Ll"))),
    min_size=1,
    max_size=5,
)

# Strategy for generating status lists
statuses_strategy = st.lists(
    st.sampled_from([status.value for status in StatusEnum]),
    min_size=1,
    max_size=3,
)


@given(
    updated_after=st.one_of(st.none(), datetime_strategy()),
    updated_before=st.one_of(st.none(), datetime_strategy()),
    sort_by=sort_by_strategy,
    sort_order=sort_order_strategy,
    page=page_strategy,
    page_size=page_size_strategy,
)
@settings(phases=[Phase.generate], max_examples=10)
def test_query_minds_accepts_date_sort_pagination_params(
    updated_after, updated_before, sort_by, sort_order, page, page_size
):
    """Test that MindQueryFilters schema accepts date filtering, sorting, and pagination parameters.
    
    **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
    
    This test will FAIL on unfixed code with ValidationError or AttributeError because 
    MindQueryFilters schema does not define these fields.
    """
    # Create MindQueryFilters with the new parameters
    # This will fail on unfixed code with ValidationError
    filters = MindQueryFilters(
        updated_after=updated_after,
        updated_before=updated_before,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    
    # Verify the filters object has the expected attributes
    assert hasattr(filters, "updated_after")
    assert hasattr(filters, "updated_before")
    assert hasattr(filters, "sort_by")
    assert hasattr(filters, "sort_order")
    assert hasattr(filters, "page")
    assert hasattr(filters, "page_size")
    
    # Verify values are correctly set
    assert filters.updated_after == updated_after
    assert filters.updated_before == updated_before
    assert filters.sort_by == sort_by
    assert filters.sort_order == sort_order
    assert filters.page == page
    assert filters.page_size == page_size


@given(
    title_search=st.one_of(st.none(), title_search_strategy),
    created_after=st.one_of(st.none(), datetime_strategy()),
    created_before=st.one_of(st.none(), datetime_strategy()),
)
@settings(phases=[Phase.generate], max_examples=10)
def test_query_minds_accepts_title_and_created_date_params(
    title_search, created_after, created_before
):
    """Test that MindQueryFilters schema accepts title search and created date filtering parameters.
    
    **Validates: Requirements 2.7, 2.8, 2.9**
    
    This test will FAIL on unfixed code with ValidationError because MindQueryFilters
    schema does not define these fields.
    """
    # Create MindQueryFilters with the new parameters
    filters = MindQueryFilters(
        title_search=title_search,
        created_after=created_after,
        created_before=created_before,
    )
    
    # Verify the filters object has the expected attributes
    assert hasattr(filters, "title_search")
    assert hasattr(filters, "created_after")
    assert hasattr(filters, "created_before")
    
    # Verify values are correctly set
    assert filters.title_search == title_search
    assert filters.created_after == created_after
    assert filters.created_before == created_before


@given(tags=st.one_of(st.none(), tags_strategy))
@settings(phases=[Phase.generate], max_examples=10)
def test_query_minds_accepts_multiple_tags(tags):
    """Test that MindQueryFilters schema accepts multiple tags parameter.
    
    **Validates: Requirements 2.10**
    
    This test validates that tags field supports list of strings for AND logic.
    """
    # Create MindQueryFilters with multiple tags
    filters = MindQueryFilters(tags=tags)
    
    # Verify the filters object has the tags attribute
    assert hasattr(filters, "tags")
    
    # Verify tags value is correctly set
    assert filters.tags == tags


@given(statuses=st.one_of(st.none(), statuses_strategy))
@settings(phases=[Phase.generate], max_examples=10)
def test_query_minds_accepts_multiple_statuses(statuses):
    """Test that MindQueryFilters schema accepts multiple statuses parameter.
    
    **Validates: Requirements 2.11**
    
    This test will FAIL on unfixed code because the schema uses 'status' (singular)
    instead of 'statuses' (plural) and doesn't support multiple values.
    """
    # Create MindQueryFilters with multiple statuses
    # This will fail on unfixed code with ValidationError
    filters = MindQueryFilters(statuses=statuses)
    
    # Verify the filters object has the statuses attribute
    assert hasattr(filters, "statuses")
    
    # Verify statuses value is correctly set
    assert filters.statuses == statuses


@given(
    updated_after=st.one_of(st.none(), datetime_strategy()),
    sort_by=sort_by_strategy,
    page=page_strategy,
    title_search=st.one_of(st.none(), title_search_strategy),
    tags=st.one_of(st.none(), tags_strategy),
)
@settings(phases=[Phase.generate], max_examples=10)
def test_query_minds_accepts_combined_parameters(
    updated_after, sort_by, page, title_search, tags
):
    """Test that MindQueryFilters schema accepts multiple new parameters combined.
    
    **Validates: Requirements 2.1, 2.3, 2.5, 2.7, 2.10**
    
    This test will FAIL on unfixed code with ValidationError when any of the
    unsupported parameters are provided.
    """
    # Create MindQueryFilters with combined parameters
    filters = MindQueryFilters(
        updated_after=updated_after,
        sort_by=sort_by,
        page=page,
        title_search=title_search,
        tags=tags,
    )
    
    # Verify all attributes exist
    assert hasattr(filters, "updated_after")
    assert hasattr(filters, "sort_by")
    assert hasattr(filters, "page")
    assert hasattr(filters, "title_search")
    assert hasattr(filters, "tags")
    
    # Verify values are correctly set
    assert filters.updated_after == updated_after
    assert filters.sort_by == sort_by
    assert filters.page == page
    assert filters.title_search == title_search
    assert filters.tags == tags


def test_query_result_includes_pagination_fields():
    """Test that QueryResult schema includes page, page_size, and total_pages fields.
    
    **Validates: Requirements 2.12**
    
    This test will FAIL on unfixed code with Pydantic ValidationError because
    QueryResult schema does not define these fields (it requires limit and offset instead).
    """
    # Create a QueryResult with pagination fields
    # This will fail on unfixed code with ValidationError
    result = QueryResult(
        items=[],
        total=0,
        page=1,
        page_size=20,
        total_pages=0,
    )
    
    # Verify all fields are present
    assert result.items == []
    assert result.total == 0
    assert result.page == 1
    assert result.page_size == 20
    assert result.total_pages == 0
