#!/usr/bin/env bash

# ============================================================================
# FastAPI Neo4j Multi-Frontend System - Logs Script
# ============================================================================
# This script displays logs from Docker Compose services.
# It can show logs for all services or a specific service.
#
# Usage: 
#   ./scripts/logs.sh              # View logs from all services
#   ./scripts/logs.sh <service>    # View logs from specific service
#
# Available services: neo4j, backend, web, xr
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

# Check if Docker Compose is available
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed or not available"
        print_info "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

# Check if services are running
check_services_running() {
    if ! docker compose ps --quiet &> /dev/null; then
        print_error "No services are currently running"
        print_info "Start services with: ./scripts/setup.sh or docker compose up"
        exit 1
    fi
}

# Display usage information
show_usage() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  FastAPI Neo4j Multi-Frontend System - Logs Viewer       ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}Usage:${NC}"
    echo -e "  ${GREEN}./scripts/logs.sh${NC}              # View logs from all services"
    echo -e "  ${GREEN}./scripts/logs.sh <service>${NC}    # View logs from specific service"
    echo ""
    
    echo -e "${BLUE}Available services:${NC}"
    echo -e "  • ${GREEN}neo4j${NC}      - Neo4j database"
    echo -e "  • ${GREEN}backend${NC}    - FastAPI backend service"
    echo -e "  • ${GREEN}web${NC}        - React web frontend"
    echo -e "  • ${GREEN}xr${NC}         - React XR frontend"
    echo ""
    
    echo -e "${BLUE}Examples:${NC}"
    echo -e "  ${GREEN}./scripts/logs.sh${NC}              # All services"
    echo -e "  ${GREEN}./scripts/logs.sh backend${NC}      # Backend only"
    echo -e "  ${GREEN}./scripts/logs.sh web${NC}          # Web frontend only"
    echo ""
    
    echo -e "${YELLOW}Tip: Press Ctrl+C to stop viewing logs${NC}\n"
}

# Validate service name
validate_service() {
    local service=$1
    local valid_services=("neo4j" "backend" "web" "xr")
    
    for valid in "${valid_services[@]}"; do
        if [ "$service" = "$valid" ]; then
            return 0
        fi
    done
    
    print_error "Invalid service name: $service"
    echo ""
    show_usage
    exit 1
}

# View logs for all services
view_all_logs() {
    print_header "Viewing Logs from All Services"
    
    print_info "Following logs from all services (press Ctrl+C to stop)..."
    echo ""
    
    docker compose logs -f
}

# View logs for specific service
view_service_logs() {
    local service=$1
    
    print_header "Viewing Logs from $service Service"
    
    print_info "Following logs from $service (press Ctrl+C to stop)..."
    echo ""
    
    docker compose logs -f "$service"
}

# Main execution
main() {
    # Check prerequisites
    check_docker_compose
    check_services_running
    
    # Parse arguments
    if [ $# -eq 0 ]; then
        # No arguments - show all logs
        view_all_logs
    elif [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        # Help requested
        show_usage
    else
        # Service name provided
        validate_service "$1"
        view_service_logs "$1"
    fi
}

# Run main function
main "$@"
