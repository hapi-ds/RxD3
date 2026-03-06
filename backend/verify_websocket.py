"""Manual verification script for WebSocket endpoint.

This script can be used to manually verify the WebSocket implementation
without running the full test suite.
"""

from src.auth.jwt_handler import decode_jwt, sign_jwt

# Test 1: JWT token generation and decoding
print("Test 1: JWT Token Generation and Decoding")
print("-" * 50)
email = "test@example.com"
token_response = sign_jwt(email)
token = token_response["access_token"]
print(f"Generated token for {email}")
print(f"Token type: {token_response['type']}")

decoded = decode_jwt(token)
if decoded is not None:
    print(f"Decoded email: {decoded.get('email')}")
else:
    print("Decoded email: None")
print(f"Token valid: {bool(decoded)}")
print()

# Test 2: Invalid token handling
print("Test 2: Invalid Token Handling")
print("-" * 50)
invalid_decoded = decode_jwt("invalid.token.here")
print(f"Invalid token decoded: {invalid_decoded}")
print(f"Returns empty dict: {invalid_decoded == {}}")
print()

# Test 3: WebSocket routes module import
print("Test 3: WebSocket Routes Module Import")
print("-" * 50)
try:
    from src.websocket.routes import manager, router

    print(f"Router imported successfully: {router}")
    print(f"Manager imported successfully: {manager}")
    print(f"Manager has active_connections: {hasattr(manager, 'active_connections')}")
    print(f"Initial connections: {len(manager.active_connections)}")
except Exception as e:
    print(f"Error importing: {e}")
print()

# Test 4: App integration
print("Test 4: App Integration")
print("-" * 50)
try:
    from src.app import app

    routes = [getattr(route, "path", None) for route in app.routes]
    print(f"WebSocket route registered: {'/ws' in routes}")
    print(f"All routes: {routes}")
except Exception as e:
    print(f"Error checking app: {e}")
print()

print("=" * 50)
print("Manual verification complete!")
print("=" * 50)
