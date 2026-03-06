#!/usr/bin/env bash

# ============================================================================
# FastAPI Neo4j Multi-Frontend System - Test Script
# ============================================================================
# This script runs all tests across backend and frontend services.
# It provides a summary of test results for quick verification.
#
# Usage: ./scripts/test.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Test results tracking
BACKEND_PASSED=false
WEB_PASSED=false
XR_PASSED=false

# Run backend tests
run_backend_tests() {
    print_header "Running Backend Tests"
    
    print_info "Executing pytest with minimal output..."
    
    if cd backend && uv run pytest -q; then
        BACKEND_PASSED=true
        print_success "Backend tests passed!"
        cd ..
    else
        BACKEND_PASSED=false
        print_error "Backend tests failed!"
        cd ..
        return 1
    fi
}

# Run web frontend tests
run_web_tests() {
    print_header "Running Web Frontend Tests"
    
    print_info "Executing npm test with silent mode..."
    
    if cd frontends/web && npm test -- --silent --run; then
        WEB_PASSED=true
        print_success "Web frontend tests passed!"
        cd ../..
    else
        WEB_PASSED=false
        print_error "Web frontend tests failed!"
        cd ../..
        return 1
    fi
}

# Run XR frontend tests
run_xr_tests() {
    print_header "Running XR Frontend Tests"
    
    print_info "Executing npm test with silent mode..."
    
    if cd frontends/xr && npm test -- --silent --run; then
        XR_PASSED=true
        print_success "XR frontend tests passed!"
        cd ../..
    else
        XR_PASSED=false
        print_error "XR frontend tests failed!"
        cd ../..
        return 1
    fi
}

# Display test summary
display_summary() {
    print_header "Test Results Summary"
    
    echo -e "${BLUE}Test Suite Results:${NC}\n"
    
    # Backend results
    if [ "$BACKEND_PASSED" = true ]; then
        echo -e "  Backend:        ${GREEN}✓ PASSED${NC}"
    else
        echo -e "  Backend:        ${RED}✗ FAILED${NC}"
    fi
    
    # Web frontend results
    if [ "$WEB_PASSED" = true ]; then
        echo -e "  Web Frontend:   ${GREEN}✓ PASSED${NC}"
    else
        echo -e "  Web Frontend:   ${RED}✗ FAILED${NC}"
    fi
    
    # XR frontend results
    if [ "$XR_PASSED" = true ]; then
        echo -e "  XR Frontend:    ${GREEN}✓ PASSED${NC}"
    else
        echo -e "  XR Frontend:    ${RED}✗ FAILED${NC}"
    fi
    
    echo ""
    
    # Overall result
    if [ "$BACKEND_PASSED" = true ] && [ "$WEB_PASSED" = true ] && [ "$XR_PASSED" = true ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║           ALL TESTS PASSED! ✓                             ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}\n"
        return 0
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║           SOME TESTS FAILED! ✗                            ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}\n"
        
        print_info "To view detailed test output, run tests individually:"
        echo -e "  • Backend:      ${BLUE}cd backend && uv run pytest -v${NC}"
        echo -e "  • Web Frontend: ${BLUE}cd frontends/web && npm test${NC}"
        echo -e "  • XR Frontend:  ${BLUE}cd frontends/xr && npm test${NC}"
        echo ""
        
        return 1
    fi
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  FastAPI Neo4j Multi-Frontend System - Test Runner       ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Run all tests (continue even if some fail)
    run_backend_tests || true
    run_web_tests || true
    run_xr_tests || true
    
    # Display summary and exit with appropriate code
    display_summary
}

# Run main function
main
