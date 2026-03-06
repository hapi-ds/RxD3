#!/usr/bin/env bash

# Integration Test Script
# Tests complete user flow: register, login, create post, WebSocket chat

set -e

echo "=========================================="
echo "Integration Testing"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
PASSED=0
FAILED=0

test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    PASSED=$((PASSED + 1))
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
    FAILED=$((FAILED + 1))
}

# 1. Test Neo4j Browser
echo "1. Testing Neo4j Browser (http://localhost:7474)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:7474 | grep -q "200"; then
    test_pass "Neo4j Browser is accessible"
else
    test_fail "Neo4j Browser is not accessible"
fi

# 2. Test Backend API
echo ""
echo "2. Testing Backend API (http://localhost:8080)..."
RESPONSE=$(curl -s http://localhost:8080/)
if echo "$RESPONSE" | grep -q "Welcome"; then
    test_pass "Backend API is accessible"
else
    test_fail "Backend API is not accessible"
fi

# 3. Test API Docs
echo ""
echo "3. Testing API Documentation (http://localhost:8080/docs)..."
if curl -s http://localhost:8080/docs | grep -q "Swagger"; then
    test_pass "API Docs (Swagger) is accessible"
else
    test_fail "API Docs (Swagger) is not accessible"
fi

# 4. Test Web Frontend
echo ""
echo "4. Testing Web Frontend (http://localhost:3000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    test_pass "Web Frontend is accessible"
else
    test_fail "Web Frontend is not accessible"
fi

# 5. Test XR Frontend
echo ""
echo "5. Testing XR Frontend (http://localhost:3001)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    test_pass "XR Frontend is accessible"
else
    test_fail "XR Frontend is not accessible"
fi

# 6. Test User Registration
echo ""
echo "6. Testing User Registration..."
RANDOM_EMAIL="testuser$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/users \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"testpass123\",\"fullname\":\"Test User\"}")

if echo "$REGISTER_RESPONSE" | grep -q "email"; then
    test_pass "User registration successful"
else
    test_fail "User registration failed: $REGISTER_RESPONSE"
fi

# 7. Test User Login
echo ""
echo "7. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/users/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$RANDOM_EMAIL&password=testpass123")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    test_pass "User login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
else
    test_fail "User login failed: $LOGIN_RESPONSE"
    TOKEN=""
fi

# 8. Test Create Post (with JWT)
if [ -n "$TOKEN" ]; then
    echo ""
    echo "8. Testing Create Post (authenticated)..."
    POST_RESPONSE=$(curl -s -X POST http://localhost:8080/posts \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"title\":\"Test Post\",\"content\":\"This is a test post\",\"tags\":[\"test\"]}")
    
    if echo "$POST_RESPONSE" | grep -q "title"; then
        test_pass "Post creation successful"
    else
        test_fail "Post creation failed: $POST_RESPONSE"
    fi
    
    # 9. Test Get Posts
    echo ""
    echo "9. Testing Get Posts (authenticated)..."
    POSTS_RESPONSE=$(curl -s -X GET http://localhost:8080/posts \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$POSTS_RESPONSE" | grep -q "Test Post"; then
        test_pass "Get posts successful"
    else
        test_fail "Get posts failed: $POSTS_RESPONSE"
    fi
else
    echo ""
    echo "8-9. Skipping authenticated tests (no token)"
    test_fail "Skipped post creation test"
    test_fail "Skipped get posts test"
fi

# 10. Test CORS from Web Frontend origin
echo ""
echo "10. Testing CORS from Web Frontend origin..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS http://localhost:8080/users \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST")

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    test_pass "CORS configured for Web Frontend"
else
    test_fail "CORS not configured for Web Frontend"
fi

# 11. Test CORS from XR Frontend origin
echo ""
echo "11. Testing CORS from XR Frontend origin..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS http://localhost:8080/users \
    -H "Origin: http://localhost:3001" \
    -H "Access-Control-Request-Method: POST")

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    test_pass "CORS configured for XR Frontend"
else
    test_fail "CORS not configured for XR Frontend"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi
