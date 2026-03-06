#!/usr/bin/env bash

# ============================================================================
# FastAPI Neo4j Multi-Frontend System - Setup Script
# ============================================================================
# This script automates the initial project setup and service startup.
# It checks prerequisites, configures environment, and starts all services.
#
# Usage: ./scripts/setup.sh
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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_good=true
    
    # Check Docker
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        print_success "Docker is installed (version $docker_version)"
    else
        print_error "Docker is not installed"
        print_info "Please install Docker from: https://docs.docker.com/get-docker/"
        all_good=false
    fi
    
    # Check Docker Compose
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version --short)
        print_success "Docker Compose is installed (version $compose_version)"
    else
        print_error "Docker Compose is not installed"
        print_info "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        all_good=false
    fi
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        print_info "Please start Docker and try again"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        print_error "Prerequisites check failed. Please install missing dependencies."
        exit 1
    fi
    
    print_success "All prerequisites are met!"
}

# Create .env file from .env.example if it doesn't exist
setup_environment() {
    print_header "Setting Up Environment"
    
    if [ -f .env ]; then
        print_warning ".env file already exists, skipping creation"
        print_info "If you want to reset it, delete .env and run this script again"
    else
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "IMPORTANT: Review .env and update JWT_SECRET and NEO4J_PASSWORD for production!"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    fi
}

# Pull base Docker images
pull_images() {
    print_header "Pulling Base Docker Images"
    
    print_info "Pulling Neo4j image..."
    docker pull neo4j:5.15-community
    
    print_info "Pulling Python base image..."
    docker pull python:3.13-slim
    
    print_info "Pulling Node.js base image..."
    docker pull node:20-alpine
    
    print_info "Pulling Nginx base image (for production builds)..."
    docker pull nginx:1.25-alpine
    
    print_success "All base images pulled successfully!"
}

# Build all services
build_services() {
    print_header "Building All Services"
    
    print_info "Building services with Docker Compose..."
    docker compose build
    
    print_success "All services built successfully!"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    print_info "Starting all services in detached mode..."
    docker compose up -d
    
    print_success "All services started successfully!"
}

# Display service URLs
display_urls() {
    print_header "Service URLs"
    
    echo -e "${GREEN}All services are now running!${NC}\n"
    
    echo -e "${BLUE}Backend Services:${NC}"
    echo -e "  • Neo4j Browser:    ${GREEN}http://localhost:7474${NC}"
    echo -e "    Username: neo4j"
    echo -e "    Password: (check .env file)"
    echo -e "  • Backend API:      ${GREEN}http://localhost:8080${NC}"
    echo -e "  • API Docs (Swagger): ${GREEN}http://localhost:8080/docs${NC}"
    echo -e "  • API Docs (ReDoc):   ${GREEN}http://localhost:8080/redoc${NC}"
    echo -e "  • WebSocket:        ${GREEN}ws://localhost:8080/ws${NC}"
    
    echo -e "\n${BLUE}Frontend Services:${NC}"
    echo -e "  • Web Frontend:     ${GREEN}http://localhost:3000${NC}"
    echo -e "  • XR Frontend:      ${GREEN}http://localhost:3001${NC}"
    
    echo -e "\n${YELLOW}Useful Commands:${NC}"
    echo -e "  • View logs:        ${BLUE}docker compose logs -f${NC}"
    echo -e "  • View specific service logs: ${BLUE}docker compose logs -f <service>${NC}"
    echo -e "  • Stop services:    ${BLUE}docker compose down${NC}"
    echo -e "  • Restart services: ${BLUE}docker compose restart${NC}"
    echo -e "  • Run tests:        ${BLUE}./scripts/test.sh${NC}"
    echo -e "  • Clean up:         ${BLUE}./scripts/clean.sh${NC}"
    
    echo -e "\n${GREEN}Setup complete! Happy coding! 🚀${NC}\n"
}

# Wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Ready"
    
    print_info "Waiting for Neo4j to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps neo4j | grep -q "healthy"; then
            print_success "Neo4j is healthy!"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            print_error "Neo4j failed to become healthy after $max_attempts attempts"
            print_info "Check logs with: docker compose logs neo4j"
            exit 1
        fi
        
        echo -n "."
        sleep 2
    done
    
    print_info "Waiting for backend to be ready..."
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8080/ > /dev/null 2>&1; then
            print_success "Backend is ready!"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            print_error "Backend failed to become ready after $max_attempts attempts"
            print_info "Check logs with: docker compose logs backend"
            exit 1
        fi
        
        echo -n "."
        sleep 2
    done
    
    print_success "All services are ready!"
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  FastAPI Neo4j Multi-Frontend System - Setup Script      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    setup_environment
    pull_images
    build_services
    start_services
    wait_for_services
    display_urls
}

# Run main function
main
