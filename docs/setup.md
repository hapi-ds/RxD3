# Setup Guide

This guide provides comprehensive instructions for installing and configuring the FastAPI Neo4j Multi-Frontend System.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Docker** 24.0 or higher
  - Download from: https://docs.docker.com/get-docker/
  - Verify installation: `docker --version`

- **Docker Compose** 2.0 or higher
  - Included with Docker Desktop on Windows and macOS
  - Linux users: https://docs.docker.com/compose/install/
  - Verify installation: `docker compose version`

- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/downloads
  - Verify installation: `git --version`

### System Requirements

- **Operating System**: Linux, macOS, or Windows 10/11 with WSL2
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: At least 10GB free space
- **Network**: Internet connection for pulling Docker images

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd fastapi-neo4j-multi-frontend-system
```

### Step 2: Configure Environment Variables

The project uses environment variables for configuration. Create your `.env` file from the provided template:

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred text editor:

```bash
nano .env
# or
vim .env
# or
code .env
```

### Environment Variable Configuration

#### Backend Configuration

**NEO4J_URI** (default: `bolt://neo4j:7687`)
- Neo4j database connection URI
- Use `bolt://neo4j:7687` for Docker Compose networking
- For external Neo4j: `bolt://your-neo4j-host:7687`

**NEO4J_USERNAME** (default: `neo4j`)
- Neo4j database username
- Default is `neo4j` for new installations

**NEO4J_PASSWORD** (default: `password`)
- Neo4j database password
- **IMPORTANT**: Change this for production deployments!
- Use a strong, unique password (minimum 8 characters)

**JWT_SECRET** (default: `your-secret-key-here`)
- Secret key for signing JWT tokens
- **CRITICAL**: Generate a strong random secret for production!
- Generate with: `openssl rand -hex 32`

**JWT_ALGORITHM** (default: `HS256`)
- Algorithm for JWT token signing
- Recommended: Keep as `HS256` unless you have specific requirements

#### Frontend Configuration

**VITE_API_URL** (default: `http://localhost:8080`)
- Backend API base URL
- For development: `http://localhost:8080`
- For production: Your backend domain (e.g., `https://api.yourdomain.com`)

**VITE_WS_URL** (default: `ws://localhost:8080/ws`)
- WebSocket endpoint URL
- For development: `ws://localhost:8080/ws`
- For production: Your WebSocket endpoint (e.g., `wss://api.yourdomain.com/ws`)

#### Example .env File

```env
# Neo4j Configuration
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-secure-password-here

# JWT Configuration
JWT_SECRET=your-generated-secret-key-here
JWT_ALGORITHM=HS256

# Frontend Configuration
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

### Step 3: Run the Setup Script

The project includes an automated setup script that handles all initialization:

```bash
./scripts/setup.sh
```

The setup script will:
1. Check prerequisites (Docker, Docker Compose)
2. Verify Docker daemon is running
3. Pull required base images
4. Build all service containers
5. Start all services
6. Wait for services to be healthy
7. Display service URLs

**Note**: The first run may take 5-10 minutes as Docker downloads base images and builds containers.

### Step 4: Verify Installation

Once the setup script completes, verify all services are running:

```bash
docker compose ps
```

You should see all services with status "Up" or "healthy":

```
NAME                                    STATUS
fastapi-neo4j-multi-frontend-system-backend-1   Up (healthy)
fastapi-neo4j-multi-frontend-system-neo4j-1     Up (healthy)
fastapi-neo4j-multi-frontend-system-web-1       Up
fastapi-neo4j-multi-frontend-system-xr-1        Up
```

## Service URLs and Ports

After successful installation, access the services at:

### Frontend Services

- **Web Frontend**: http://localhost:3000
  - React-based browser interface
  - Login, view posts, real-time chat

- **XR Frontend**: http://localhost:3001
  - WebXR immersive interface
  - VR/AR support with 3D avatars

### Backend Services

- **Backend API**: http://localhost:8080
  - REST API endpoints
  - Health check at: http://localhost:8080/

- **API Documentation (Swagger)**: http://localhost:8080/docs
  - Interactive API documentation
  - Test endpoints directly in browser

- **API Documentation (ReDoc)**: http://localhost:8080/redoc
  - Alternative API documentation format
  - Clean, readable interface

- **WebSocket Endpoint**: ws://localhost:8080/ws
  - Real-time bidirectional communication
  - Requires JWT token authentication

### Database Services

- **Neo4j Browser**: http://localhost:7474
  - Web-based Neo4j query interface
  - Username: `neo4j`
  - Password: (from your `.env` file)

- **Neo4j Bolt Protocol**: bolt://localhost:7687
  - Direct database connection
  - Used by backend service

## Manual Installation (Alternative)

If you prefer manual setup or the script fails, follow these steps:

### 1. Create Environment File

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Pull Base Images

```bash
docker pull neo4j:5.15-community
docker pull python:3.13-slim
docker pull node:20-alpine
docker pull nginx:1.25-alpine
```

### 3. Build Services

```bash
docker compose build
```

### 4. Start Services

```bash
docker compose up -d
```

### 5. Check Service Health

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f neo4j
```

## Troubleshooting

### Services Won't Start

**Problem**: Docker Compose fails to start services

**Solutions**:
1. Check Docker daemon is running: `docker info`
2. Verify port availability: `lsof -i :3000,3001,7474,7687,8080`
3. Check Docker logs: `docker compose logs`
4. Restart Docker daemon
5. Remove old containers: `docker compose down -v` then retry

### Neo4j Connection Errors

**Problem**: Backend can't connect to Neo4j

**Solutions**:
1. Wait for Neo4j to be healthy: `docker compose ps neo4j`
2. Check Neo4j logs: `docker compose logs neo4j`
3. Verify credentials in `.env` match Neo4j configuration
4. Restart backend: `docker compose restart backend`

### Port Already in Use

**Problem**: Error "port is already allocated"

**Solutions**:
1. Identify process using port: `lsof -i :<port>`
2. Stop conflicting service or change port in `docker-compose.yml`
3. For Neo4j (7474, 7687): Stop local Neo4j installation
4. For backend (8080): Stop other API services
5. For frontends (3000, 3001): Stop other dev servers

### Frontend Can't Connect to Backend

**Problem**: Frontend shows connection errors

**Solutions**:
1. Verify backend is running: `curl http://localhost:8080/`
2. Check CORS configuration in `backend/src/app.py`
3. Verify `VITE_API_URL` in `.env` is correct
4. Check browser console for specific errors
5. Restart frontend: `docker compose restart web xr`

### Hot-Reload Not Working

**Problem**: Code changes don't trigger reload

**Solutions**:
1. Verify volumes are mounted: `docker compose config`
2. Check file permissions (especially on Linux)
3. Restart specific service: `docker compose restart <service>`
4. For backend: Check uvicorn is running with `--reload` flag
5. For frontends: Check Vite dev server is running

### Database Data Lost After Restart

**Problem**: Neo4j data disappears after stopping containers

**Solutions**:
1. Use named volumes (already configured in `docker-compose.yml`)
2. Don't use `docker compose down -v` (removes volumes)
3. Use `docker compose down` to preserve data
4. Backup data: `docker compose exec neo4j neo4j-admin dump`

## Next Steps

After successful installation:

1. **Create Your First User**
   - Visit http://localhost:3000
   - Click "Register" or use API: `POST /users`

2. **Explore the API**
   - Visit http://localhost:8080/docs
   - Try the interactive endpoints

3. **Test WebSocket Connection**
   - Login to web frontend
   - Open chat interface
   - Send messages in real-time

4. **Try XR Frontend**
   - Visit http://localhost:3001
   - Login with your credentials
   - Experience the 3D environment

5. **Read Additional Documentation**
   - [Architecture Guide](architecture.md) - System design and components
   - [API Reference](api.md) - Complete API documentation
   - [Development Guide](development.md) - Development workflows

## Production Deployment

For production deployment, additional steps are required:

### Security Hardening

1. **Generate Strong Secrets**
   ```bash
   # Generate JWT secret
   openssl rand -hex 32
   
   # Generate Neo4j password
   openssl rand -base64 24
   ```

2. **Update Environment Variables**
   - Set production URLs in `VITE_API_URL` and `VITE_WS_URL`
   - Use HTTPS/WSS protocols
   - Never commit `.env` to version control

3. **Enable HTTPS**
   - Configure SSL/TLS certificates
   - Update nginx configuration
   - Use Let's Encrypt for free certificates

4. **Restrict CORS Origins**
   - Edit `backend/src/app.py`
   - Replace localhost origins with production domains

5. **Use Production Docker Compose**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### Monitoring and Logging

1. **Enable Production Logging**
   - Configure log aggregation
   - Set up error tracking (e.g., Sentry)

2. **Health Checks**
   - Monitor service health endpoints
   - Set up alerts for downtime

3. **Database Backups**
   - Schedule regular Neo4j backups
   - Test restore procedures

For detailed production deployment instructions, see the [Architecture Guide](architecture.md).

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Development Guide](development.md) for common workflows
2. Review service logs: `./scripts/logs.sh <service>`
3. Search existing GitHub issues
4. Open a new issue with:
   - Error messages
   - Service logs
   - Environment details (OS, Docker version)
   - Steps to reproduce

## Summary

You should now have:
- ✓ All prerequisites installed
- ✓ Environment variables configured
- ✓ All services running and healthy
- ✓ Access to frontend and backend interfaces
- ✓ Understanding of service URLs and ports

Ready to start developing! Check out the [Development Guide](development.md) for next steps.
