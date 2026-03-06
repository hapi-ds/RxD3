#!/usr/bin/env bash

# ============================================================================
# FastAPI Neo4j Multi-Frontend System - Cleanup Script
# ============================================================================
# This script stops all services and removes build artifacts.
# It provides options to remove Docker volumes (data persistence).
#
# Usage: ./scripts/clean.sh
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

# Stop Docker containers
stop_containers() {
    print_header "Stopping Docker Containers"
    
    if docker compose ps --quiet | grep -q .; then
        print_info "Stopping all services..."
        docker compose down
        print_success "All containers stopped!"
    else
        print_info "No running containers found"
    fi
}

# Prompt user to remove volumes
prompt_remove_volumes() {
    print_header "Docker Volumes"
    
    print_warning "Docker volumes contain persistent data:"
    echo -e "  • ${BLUE}neo4j_data${NC}       - Neo4j database data"
    echo -e "  • ${BLUE}neo4j_logs${NC}       - Neo4j logs"
    echo -e "  • ${BLUE}backend_venv${NC}     - Python virtual environment"
    echo -e "  • ${BLUE}web_node_modules${NC} - Web frontend dependencies"
    echo -e "  • ${BLUE}xr_node_modules${NC}  - XR frontend dependencies"
    echo ""
    
    print_warning "Removing volumes will delete all database data and require rebuilding dependencies!"
    echo -e "${YELLOW}Do you want to remove Docker volumes? (y/N)${NC} "
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Removing Docker volumes..."
        docker compose down -v
        print_success "Docker volumes removed!"
    else
        print_info "Keeping Docker volumes (data preserved)"
    fi
}

# Remove Python build artifacts
remove_python_artifacts() {
    print_header "Removing Python Build Artifacts"
    
    print_info "Searching for __pycache__ directories..."
    if find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null; then
        print_success "Removed __pycache__ directories"
    fi
    
    print_info "Searching for .pyc files..."
    if find backend -type f -name "*.pyc" -delete 2>/dev/null; then
        print_success "Removed .pyc files"
    fi
    
    print_info "Searching for .pyo files..."
    if find backend -type f -name "*.pyo" -delete 2>/dev/null; then
        print_success "Removed .pyo files"
    fi
    
    print_info "Searching for .pytest_cache directories..."
    if find backend -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null; then
        print_success "Removed .pytest_cache directories"
    fi
    
    print_info "Searching for .coverage files..."
    if find backend -type f -name ".coverage" -delete 2>/dev/null; then
        print_success "Removed .coverage files"
    fi
    
    print_info "Searching for htmlcov directories..."
    if find backend -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null; then
        print_success "Removed htmlcov directories"
    fi
}

# Remove Node.js build artifacts
remove_node_artifacts() {
    print_header "Removing Node.js Build Artifacts"
    
    # Web frontend
    if [ -d "frontends/web/node_modules" ]; then
        print_info "Removing web frontend node_modules..."
        rm -rf frontends/web/node_modules
        print_success "Removed web frontend node_modules"
    fi
    
    if [ -d "frontends/web/dist" ]; then
        print_info "Removing web frontend dist..."
        rm -rf frontends/web/dist
        print_success "Removed web frontend dist"
    fi
    
    # XR frontend
    if [ -d "frontends/xr/node_modules" ]; then
        print_info "Removing XR frontend node_modules..."
        rm -rf frontends/xr/node_modules
        print_success "Removed XR frontend node_modules"
    fi
    
    if [ -d "frontends/xr/dist" ]; then
        print_info "Removing XR frontend dist..."
        rm -rf frontends/xr/dist
        print_success "Removed XR frontend dist"
    fi
}

# Remove log files
remove_log_files() {
    print_header "Removing Log Files"
    
    print_info "Searching for .log files..."
    local log_count=$(find . -type f -name "*.log" 2>/dev/null | wc -l)
    
    if [ "$log_count" -gt 0 ]; then
        find . -type f -name "*.log" -delete 2>/dev/null
        print_success "Removed $log_count log file(s)"
    else
        print_info "No log files found"
    fi
}

# Display cleanup summary
display_summary() {
    print_header "Cleanup Summary"
    
    echo -e "${GREEN}Cleanup completed successfully!${NC}\n"
    
    echo -e "${BLUE}What was cleaned:${NC}"
    echo -e "  ${GREEN}✓${NC} Docker containers stopped"
    echo -e "  ${GREEN}✓${NC} Python build artifacts removed (__pycache__, .pyc, .pyo)"
    echo -e "  ${GREEN}✓${NC} Node.js build artifacts removed (node_modules, dist)"
    echo -e "  ${GREEN}✓${NC} Log files removed"
    
    echo -e "\n${YELLOW}To start fresh:${NC}"
    echo -e "  1. Run: ${BLUE}./scripts/setup.sh${NC}"
    echo -e "  2. Or:  ${BLUE}docker compose up -d${NC}"
    
    echo -e "\n${GREEN}Cleanup complete! 🧹${NC}\n"
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  FastAPI Neo4j Multi-Frontend System - Cleanup Script    ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    stop_containers
    prompt_remove_volumes
    remove_python_artifacts
    remove_node_artifacts
    remove_log_files
    display_summary
}

# Run main function
main
