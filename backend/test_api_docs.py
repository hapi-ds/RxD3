#!/usr/bin/env python3
"""Test script to verify API documentation enhancements."""

import sys

sys.path.insert(0, 'src')

try:
    from src.app import app

    # Check if app is created successfully
    print("✓ App imported successfully")

    # Check OpenAPI schema
    openapi_schema = app.openapi()

    # Verify title and version
    assert openapi_schema.get("info", {}).get("title") == "FastAPI Neo4j Multi-Frontend System"
    print("✓ API title is correct")

    assert openapi_schema.get("info", {}).get("version") == "1.0.0"
    print("✓ API version is correct")

    # Verify description exists and contains key information
    description = openapi_schema.get("info", {}).get("description", "")
    assert "JWT Authentication" in description
    assert "Multi-Frontend System API" in description
    print("✓ API description contains authentication info")

    # Verify tags are defined
    tags = openapi_schema.get("tags", [])
    tag_names = [tag["name"] for tag in tags]
    assert "Root" in tag_names
    assert "Administrator" in tag_names
    assert "Posts" in tag_names
    assert "WebSocket" in tag_names
    print(f"✓ All tags defined: {tag_names}")

    # Verify paths exist
    paths = openapi_schema.get("paths", {})
    assert "/users" in paths
    assert "/users/login" in paths
    assert "/posts" in paths
    print(f"✓ All main paths exist: {list(paths.keys())}")

    # Check user registration endpoint has detailed description
    user_post = paths.get("/users", {}).get("post", {})
    assert user_post.get("summary") == "Register a new user"
    assert "Create a new user account" in user_post.get("description", "")
    print("✓ User registration endpoint has detailed description")

    # Check login endpoint has detailed description
    login_post = paths.get("/users/login", {}).get("post", {})
    assert login_post.get("summary") == "Login and get JWT token"
    assert "JWT access token" in login_post.get("description", "")
    print("✓ Login endpoint has detailed description")

    # Check posts endpoint has detailed description
    posts_post = paths.get("/posts", {}).get("post", {})
    assert posts_post.get("summary") == "Create a new post"
    assert "Authentication Required" in posts_post.get("description", "")
    print("✓ Create post endpoint has detailed description")

    # Verify response examples exist
    assert "responses" in user_post
    assert "201" in user_post["responses"]
    print("✓ Response examples are defined")

    # Check schemas have examples
    schemas = openapi_schema.get("components", {}).get("schemas", {})

    if "UserCreate" in schemas:
        user_create_schema = schemas["UserCreate"]
        assert "examples" in user_create_schema or "example" in user_create_schema.get("properties", {}).get("email", {})
        print("✓ UserCreate schema has examples")

    if "PostCreate" in schemas:
        post_create_schema = schemas["PostCreate"]
        assert "examples" in post_create_schema or "example" in post_create_schema.get("properties", {}).get("title", {})
        print("✓ PostCreate schema has examples")

    print("\n" + "="*60)
    print("✅ All API documentation enhancements verified successfully!")
    print("="*60)
    print("\nDocumentation is available at:")
    print("  - Swagger UI: http://localhost:8080/docs")
    print("  - ReDoc: http://localhost:8080/redoc")
    print("  - OpenAPI JSON: http://localhost:8080/openapi.json")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
