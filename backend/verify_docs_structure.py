#!/usr/bin/env python3
"""Verify API documentation structure without running the app."""

import ast
import sys


def check_file_syntax(filepath):
    """Check if a Python file has valid syntax."""
    try:
        with open(filepath, 'r') as f:
            ast.parse(f.read())
        return True, None
    except SyntaxError as e:
        return False, str(e)

def check_for_patterns(filepath, patterns):
    """Check if file contains expected patterns."""
    with open(filepath, 'r') as f:
        content = f.read()

    found = {}
    for pattern_name, pattern in patterns.items():
        found[pattern_name] = pattern in content

    return found

print("Verifying API Documentation Enhancements...")
print("=" * 60)

# Check syntax of modified files
files_to_check = [
    'src/app.py',
    'src/routes/users.py',
    'src/routes/posts.py',
    'src/schemas/users.py',
    'src/schemas/posts.py'
]

print("\n1. Checking Python syntax...")
all_valid = True
for filepath in files_to_check:
    valid, error = check_file_syntax(filepath)
    if valid:
        print(f"  ✓ {filepath}")
    else:
        print(f"  ✗ {filepath}: {error}")
        all_valid = False

if not all_valid:
    print("\n❌ Syntax errors found!")
    sys.exit(1)

# Check app.py for OpenAPI enhancements
print("\n2. Checking app.py for OpenAPI configuration...")
app_patterns = {
    'title': 'title="FastAPI Neo4j Multi-Frontend System"',
    'version': 'version="1.0.0"',
    'description': 'Multi-Frontend System API',
    'authentication_docs': 'JWT Authentication',
    'tags': 'openapi_tags=',
    'contact': 'contact={',
    'license': 'license_info={'
}

app_results = check_for_patterns('src/app.py', app_patterns)
for pattern_name, found in app_results.items():
    status = "✓" if found else "✗"
    print(f"  {status} {pattern_name}: {'Found' if found else 'Missing'}")

# Check users.py for endpoint documentation
print("\n3. Checking users.py for endpoint documentation...")
users_patterns = {
    'register_summary': 'summary="Register a new user"',
    'register_description': 'Create a new user account',
    'login_summary': 'summary="Login and get JWT token"',
    'login_description': 'JWT access token',
    'response_model': 'response_model=',
    'responses': 'responses={'
}

users_results = check_for_patterns('src/routes/users.py', users_patterns)
for pattern_name, found in users_results.items():
    status = "✓" if found else "✗"
    print(f"  {status} {pattern_name}: {'Found' if found else 'Missing'}")

# Check posts.py for endpoint documentation
print("\n4. Checking posts.py for endpoint documentation...")
posts_patterns = {
    'create_summary': 'summary="Create a new post"',
    'create_description': 'Authentication Required',
    'get_summary': 'summary="Get all posts"',
    'update_summary': 'summary="Update a post"',
    'delete_summary': 'summary="Delete a post"',
    'response_model': 'response_model='
}

posts_results = check_for_patterns('src/routes/posts.py', posts_patterns)
for pattern_name, found in posts_results.items():
    status = "✓" if found else "✗"
    print(f"  {status} {pattern_name}: {'Found' if found else 'Missing'}")

# Check schemas for examples
print("\n5. Checking schemas for examples...")
users_schema_patterns = {
    'field_descriptions': 'description=',
    'field_examples': 'examples=',
    'model_config': 'model_config =',
    'user_response': 'class UserResponse'
}

users_schema_results = check_for_patterns('src/schemas/users.py', users_schema_patterns)
for pattern_name, found in users_schema_results.items():
    status = "✓" if found else "✗"
    print(f"  {status} users.py - {pattern_name}: {'Found' if found else 'Missing'}")

posts_schema_patterns = {
    'field_descriptions': 'description=',
    'field_examples': 'examples=',
    'model_config': 'model_config =',
    'post_response': 'class PostResponse'
}

posts_schema_results = check_for_patterns('src/schemas/posts.py', posts_schema_patterns)
for pattern_name, found in posts_schema_results.items():
    status = "✓" if found else "✗"
    print(f"  {status} posts.py - {pattern_name}: {'Found' if found else 'Missing'}")

# Summary
print("\n" + "=" * 60)
all_checks = (
    all(app_results.values()) and
    all(users_results.values()) and
    all(posts_results.values()) and
    all(users_schema_results.values()) and
    all(posts_schema_results.values())
)

if all_checks:
    print("✅ All API documentation enhancements are in place!")
    print("\nEnhancements include:")
    print("  • Detailed endpoint descriptions")
    print("  • Request/response examples")
    print("  • JWT authentication documentation")
    print("  • OpenAPI schema with tags and metadata")
    print("  • Response models with examples")
    print("\nDocumentation will be available at:")
    print("  • Swagger UI: http://localhost:8080/docs")
    print("  • ReDoc: http://localhost:8080/redoc")
else:
    print("⚠️  Some documentation enhancements may be incomplete")
    print("Please review the checks above")

print("=" * 60)
