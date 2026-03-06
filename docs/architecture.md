# Architecture Documentation

This document explains the system architecture, component relationships, data flow, and design decisions for the FastAPI Neo4j Multi-Frontend System.

## Table of Contents

- [System Overview](#system-overview)
- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Authentication Flow](#authentication-flow)
- [WebSocket Communication](#websocket-communication)
- [Database Schema](#database-schema)
- [Docker Architecture](#docker-architecture)
- [Design Decisions](#design-decisions)

## System Overview

The FastAPI Neo4j Multi-Frontend System is a production-ready multi-frontend architecture featuring:

- **Backend**: FastAPI with Neo4j graph database, JWT authentication, and WebSocket support
- **Web Frontend**: React 18 with TypeScript and Vite for browser-based access
- **XR Frontend**: React Three Fiber with WebXR for immersive VR/AR experiences
- **Orchestration**: Docker Compose for unified service management

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                        │
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Neo4j      │                                               │
│  │   Database   │                                               │
│  │   :7687      │                                               │
│  │   :7474      │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         │ Bolt Protocol                                         │
│         │                                                        │
│  ┌──────▼───────────────────────────────────┐                  │
│  │         FastAPI Backend                   │                  │
│  │         :8080                             │                  │
│  │  ┌─────────────┐    ┌─────────────────┐ │                  │
│  │  │  REST API   │    │   WebSocket     │ │                  │
│  │  │  Endpoints  │    │   Module        │ │                  │
│  │  └─────────────┘    └─────────────────┘ │                  │
│  │  ┌─────────────────────────────────────┐│                  │
│  │  │   JWT Authentication                 ││                  │
│  │  └─────────────────────────────────────┘│                  │
│  └──────▲───────────────────────▲───────────┘                  │
│         │                       │                               │
│         │ HTTP/WS              │ HTTP/WS                       │
│         │                       │                               │
│  ┌──────┴──────────┐    ┌──────┴──────────┐                   │
│  │  React Web      │    │  React XR       │                   │
│  │  Frontend       │    │  Frontend       │                   │
│  │  :3000          │    │  :3001          │                   │
│  └─────────────────┘    └─────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
fastapi-neo4j-multi-frontend-system/
│
├── backend/                          # FastAPI backend service
│   ├── src/                         # Source code (src/ layout prevents import bleed)
│   │   ├── __init__.py
│   │   ├── main.py                  # Application entry point (uvicorn)
│   │   ├── app.py                   # FastAPI app configuration
│   │   │
│   │   ├── auth/                    # JWT authentication module
│   │   │   ├── __init__.py
│   │   │   ├── jwt_handler.py       # Token signing and decoding
│   │   │   ├── jwt_bearer.py        # HTTP Bearer authentication
│   │   │   └── deps.py              # Dependency injection helpers
│   │   │
│   │   ├── config/                  # Configuration management
│   │   │   ├── __init__.py
│   │   │   └── config.py            # Pydantic settings from environment
│   │   │
│   │   ├── database/                # Neo4j connection
│   │   │   ├── __init__.py
│   │   │   └── database.py          # neontology initialization
│   │   │
│   │   ├── models/                  # Neo4j node/relationship models
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # UserNode (email, password, fullname)
│   │   │   └── post.py              # PosteNode, Posted relationship
│   │   │
│   │   ├── routes/                  # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── users.py             # User CRUD + login
│   │   │   └── posts.py             # Post CRUD
│   │   │
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── users.py             # UserCreate, UserUpdate, Token
│   │   │   └── posts.py             # PostCreate, PostUpdate
│   │   │
│   │   └── websocket/               # WebSocket real-time communication
│   │       ├── __init__.py
│   │       ├── manager.py           # Connection manager
│   │       └── routes.py            # WebSocket endpoints
│   │
│   ├── tests/                       # pytest test suite
│   │   ├── __init__.py
│   │   ├── conftest.py              # Shared fixtures
│   │   ├── test_auth.py             # JWT tests
│   │   ├── test_users.py            # User endpoint tests
│   │   ├── test_posts.py            # Post endpoint tests
│   │   └── test_websocket.py        # WebSocket tests
│   │
│   ├── Dockerfile                   # Multi-stage build
│   ├── pyproject.toml               # uv dependencies
│   └── uv.lock                      # Locked dependencies
│
├── frontends/
│   ├── web/                         # React web frontend
│   │   ├── src/
│   │   │   ├── main.tsx             # Entry point
│   │   │   ├── App.tsx              # Root component with routing
│   │   │   │
│   │   │   ├── components/          # React components
│   │   │   │   ├── Login.tsx        # Authentication form
│   │   │   │   ├── PostList.tsx     # Display posts
│   │   │   │   ├── PostForm.tsx     # Create/edit posts
│   │   │   │   └── WebSocketChat.tsx # Real-time chat
│   │   │   │
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   │   ├── useAuth.ts       # Authentication state
│   │   │   │   └── useWebSocket.ts  # WebSocket connection
│   │   │   │
│   │   │   ├── services/            # API clients
│   │   │   │   ├── api.ts           # REST API client (axios)
│   │   │   │   └── websocket.ts     # WebSocket client wrapper
│   │   │   │
│   │   │   └── types/               # TypeScript interfaces
│   │   │       └── index.ts
│   │   │
│   │   ├── tests/                   # React Testing Library
│   │   ├── Dockerfile               # Multi-stage build
│   │   ├── package.json
│   │   ├── tsconfig.json            # Strict TypeScript config
│   │   └── vite.config.ts           # Vite configuration
│   │
│   └── xr/                          # XR/VR frontend
│       ├── src/
│       │   ├── main.tsx             # Entry point
│       │   ├── App.tsx              # Root XR component
│       │   │
│       │   ├── components/          # 3D components
│       │   │   ├── Scene.tsx        # Main 3D scene with XR support
│       │   │   ├── Avatar.tsx       # User avatar representation
│       │   │   └── Controls.tsx     # VR controller handling
│       │   │
│       │   ├── hooks/               # Shared with web
│       │   │   ├── useAuth.ts
│       │   │   └── useWebSocket.ts
│       │   │
│       │   ├── services/            # Shared with web
│       │   │   ├── api.ts
│       │   │   └── websocket.ts
│       │   │
│       │   └── types/
│       │       └── index.ts
│       │
│       ├── tests/
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── docs/                            # Documentation
│   ├── setup.md                     # Installation guide
│   ├── architecture.md              # This file
│   ├── api.md                       # API reference
│   └── development.md               # Development workflows
│
├── scripts/                         # Helper scripts
│   ├── setup.sh                     # Initial setup
│   ├── test.sh                      # Run all tests
│   ├── clean.sh                     # Clean containers/volumes
│   └── logs.sh                      # View service logs
│
├── docker-compose.yml               # Root orchestration
├── .env.example                     # Environment variables template
├── .gitignore
└── README.md                        # Project overview
```

### Directory Layout Rationale

**Backend src/ Layout**: Using `src/` directory prevents Python import bleed and ensures accurate testing environments. All imports use `from src.module import ...` format.

**Frontend Separation**: Web and XR frontends are separate applications sharing common services and hooks, enabling independent development and deployment.

**Centralized Documentation**: All documentation in `docs/` directory for easy discovery and maintenance.

**Helper Scripts**: Common development tasks automated in `scripts/` directory.

## Component Architecture

### Backend Components

#### 1. FastAPI Application (app.py)

**Responsibilities**:
- Configure FastAPI application
- Add CORS middleware for multiple frontend origins
- Register API routers
- Configure lifespan events (database initialization)

**Key Features**:
- Async request handling
- Automatic OpenAPI documentation
- CORS support for localhost:3000 and localhost:3001
- Health check endpoint at `/`

#### 2. Authentication Module (auth/)

**jwt_handler.py**:
- `sign_jwt(email: str)`: Generate JWT token with 40-minute expiration
- `decode_jwt(token: str)`: Validate and decode JWT token

**jwt_bearer.py**:
- `JWTBearer`: FastAPI dependency for HTTP Bearer authentication
- Extracts token from Authorization header
- Validates token using `decode_jwt`

**deps.py**:
- `get_current_user()`: Dependency injection for getting authenticated user
- Used in protected endpoints

#### 3. Database Module (database/)

**database.py**:
- Initialize neontology with Neo4j connection
- Configure connection pooling
- Provide database session management

#### 4. Models Module (models/)

**user.py**:
- `UserNode`: Neo4j node representing users
- Properties: id (UUID), email (primary), password (hashed), fullname

**post.py**:
- `PosteNode`: Neo4j node representing posts
- Properties: id (UUID, primary), title, content, date_created, date_updated, tags
- `Posted`: Relationship from UserNode to PosteNode

#### 5. Routes Module (routes/)

**users.py**:
- `POST /users`: Register new user
- `POST /users/login`: Authenticate and get JWT
- `PUT /users/{uuid}`: Update user (protected)
- `DELETE /users/{uuid}`: Delete user (protected)

**posts.py**:
- `POST /posts`: Create post (protected)
- `GET /posts`: List all posts (protected)
- `PUT /posts/{uuid}`: Update post (protected)
- `DELETE /posts/{uuid}`: Delete post (protected)

#### 6. WebSocket Module (websocket/)

**manager.py**:
- `ConnectionManager`: Manages active WebSocket connections
- Maps user email to WebSocket connection
- Handles broadcast to all connected clients
- Cleans up dead connections

**routes.py**:
- `GET /ws`: WebSocket endpoint with JWT authentication
- Validates token on connection
- Handles incoming messages and broadcasts
- Notifies on user join/leave events

### Frontend Components

#### Web Frontend (frontends/web/)

**Components**:
- `Login.tsx`: Authentication form with email/password
- `PostList.tsx`: Display list of posts with edit/delete actions
- `PostForm.tsx`: Create/edit post form with validation
- `WebSocketChat.tsx`: Real-time chat interface

**Hooks**:
- `useAuth()`: Manages authentication state and localStorage
- `useWebSocket()`: Manages WebSocket connection and message history

**Services**:
- `api.ts`: Axios-based REST API client with JWT interceptor
- `websocket.ts`: WebSocket client wrapper with reconnection logic

#### XR Frontend (frontends/xr/)

**Components**:
- `Scene.tsx`: Main 3D scene with XR support (React Three Fiber)
- `Avatar.tsx`: 3D user representation (sphere with label)
- `Controls.tsx`: VR controller handling

**Shared Services**: Uses same auth and WebSocket services as web frontend

## Data Flow

### User Registration Flow

```
┌─────────┐     POST /users      ┌─────────┐     Create User    ┌─────────┐
│  Web    │ ──────────────────> │ Backend │ ─────────────────> │  Neo4j  │
│ Frontend│  {email, password}   │   API   │   UserNode         │Database │
└─────────┘                      └─────────┘                    └─────────┘
     │                                │                               │
     │                                │ <─────────────────────────────┘
     │                                │   User created
     │ <──────────────────────────────┘
     │   {id, email, fullname}
     │
```

### Authentication Flow

```
┌─────────┐   POST /users/login  ┌─────────┐   Match by email   ┌─────────┐
│  Web    │ ──────────────────> │ Backend │ ─────────────────> │  Neo4j  │
│ Frontend│  {email, password}   │   API   │                    │Database │
└─────────┘                      └─────────┘                    └─────────┘
     │                                │                               │
     │                                │ <─────────────────────────────┘
     │                                │   UserNode
     │                                │
     │                                ├─ Verify password (bcrypt)
     │                                │
     │                                ├─ Generate JWT token
     │                                │   {email, expires}
     │                                │
     │ <──────────────────────────────┘
     │   {access_token, type: "Bearer"}
     │
     ├─ Store token in localStorage
     │
```

### Post Creation Flow

```
┌─────────┐   POST /posts        ┌─────────┐   Validate JWT     ┌─────────┐
│  Web    │ ──────────────────> │ Backend │ ─────────────────> │   JWT   │
│ Frontend│  Authorization:      │   API   │   decode_jwt()     │ Handler │
└─────────┘  Bearer <token>      └─────────┘                    └─────────┘
     │        {title, content}        │                               │
     │                                │ <─────────────────────────────┘
     │                                │   {email, expires}
     │                                │
     │                                ├─ Get current user
     │                                │
     │                                ├─ Create PosteNode      ┌─────────┐
     │                                │ ───────────────────────>│  Neo4j  │
     │                                │   Create Posted         │Database │
     │                                │   relationship          └─────────┘
     │                                │                               │
     │                                │ <─────────────────────────────┘
     │                                │   Post created
     │ <──────────────────────────────┘
     │   {id, title, content, ...}
     │
```

### WebSocket Message Flow

```
┌─────────┐   WS Connect         ┌─────────┐   Validate JWT     ┌─────────┐
│  Web    │ ──────────────────> │ Backend │ ─────────────────> │   JWT   │
│Frontend │  ?token=<jwt>        │WebSocket│   decode_jwt()     │ Handler │
│   A     │                      │ Manager │                    └─────────┘
└─────────┘                      └─────────┘                          │
     │                                │ <──────────────────────────────┘
     │                                │   {email, expires}
     │                                │
     │                                ├─ Accept connection
     │                                │   Register: email -> WebSocket
     │                                │
     │ <──────────────────────────────┘
     │   Connection accepted
     │
     │   Send message
     │ ──────────────────────────────>
     │   {type: "message",            │
     │    content: "Hello"}            │
     │                                │
     │                                ├─ Broadcast to all except sender
     │                                │
     │                                ├──────────────────────────────> ┌─────────┐
     │                                │   {type: "message",            │  Web    │
     │                                │    sender: "a@example.com",    │Frontend │
     │                                │    content: "Hello"}           │   B     │
     │                                │                                └─────────┘
```

## Authentication Flow

### JWT Token Structure

**Payload**:
```json
{
  "email": "user@example.com",
  "expires": 1705320000
}
```

**Token Generation**:
1. User submits credentials to `POST /users/login`
2. Backend verifies password using bcrypt
3. Backend calls `sign_jwt(email)` to generate token
4. Token includes email and expiration (40 minutes)
5. Token signed with `JWT_SECRET` using `HS256` algorithm
6. Token returned to client: `{access_token: "...", type: "Bearer"}`

**Token Validation**:
1. Client includes token in Authorization header: `Bearer <token>`
2. `JWTBearer` dependency extracts token
3. `decode_jwt(token)` validates signature and expiration
4. If valid, returns payload with email
5. If invalid/expired, returns empty dict and raises 403 error

**Token Storage**:
- Web frontend: localStorage
- XR frontend: localStorage
- Included in all API requests via axios interceptor
- Included in WebSocket connection via query parameter

### CORS Configuration

Backend allows requests from multiple origins:
```python
allow_origins=[
    "http://localhost:3000",  # Web frontend
    "http://localhost:3001",  # XR frontend
    "http://web:3000",        # Docker network
    "http://xr:3001",         # Docker network
]
```

Credentials (cookies, auth headers) are allowed for authenticated requests.

## WebSocket Communication

### Connection Manager Architecture

The `ConnectionManager` class manages all active WebSocket connections:

```python
class ConnectionManager:
    def __init__(self):
        # Map: email -> WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, email: str):
        """Accept connection and register user"""
        await websocket.accept()
        self.active_connections[email] = websocket
    
    def disconnect(self, email: str):
        """Remove connection from registry"""
        self.active_connections.pop(email, None)
    
    async def broadcast(self, message: dict, sender_email: str):
        """Send message to all connected users except sender"""
        for email, connection in self.active_connections.items():
            if email != sender_email:
                await connection.send_json(message)
```

### Message Protocol

**Client → Server** (Send message):
```json
{
  "type": "message",
  "content": "Hello, world!"
}
```

**Server → Clients** (Broadcast message):
```json
{
  "type": "message",
  "sender": "user@example.com",
  "content": "Hello, world!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Server → Clients** (User event):
```json
{
  "type": "user_event",
  "event": "joined",
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Connection Lifecycle

1. **Connection**: Client connects with JWT token in query parameter
2. **Authentication**: Server validates token using `decode_jwt`
3. **Registration**: Server adds connection to `active_connections` map
4. **Communication**: Client sends messages, server broadcasts to others
5. **Disconnection**: Server removes connection from registry
6. **Notification**: Server notifies other clients of user leaving

## Database Schema

### Neo4j Graph Model

```
(:User {id, email, password, fullname})
    │
    │ [:POSTED]
    │
    ▼
(:Poste {id, title, content, date_created, date_updated, tags})
```

### Node: User

**Label**: `User`
**Primary Property**: `email`

**Properties**:
- `id`: UUID (unique identifier)
- `email`: String (unique, primary property)
- `password`: String (bcrypt hashed)
- `fullname`: String (display name)

**Indexes**:
- Unique constraint on `email`

### Node: Poste

**Label**: `Poste`
**Primary Property**: `id`

**Properties**:
- `id`: UUID (unique identifier, primary property)
- `title`: String (post title)
- `content`: String (post body)
- `date_created`: DateTime (creation timestamp)
- `date_updated`: DateTime (last update timestamp)
- `tags`: List[String] (array of tags)

**Indexes**:
- Unique constraint on `id`

### Relationship: POSTED

**Type**: `POSTED`
**Direction**: User → Poste

**Properties**: None

**Semantics**: Represents authorship - a User created a Poste

### Example Graph

```
(alice@example.com:User)─[:POSTED]→(Hello World:Poste)
(alice@example.com:User)─[:POSTED]→(Neo4j Tips:Poste)
(bob@example.com:User)─[:POSTED]→(FastAPI Guide:Poste)
```

## Docker Architecture

### Service Dependencies

```
neo4j (database)
  ↓
backend (depends on neo4j healthy)
  ↓
web, xr (depend on backend)
```

### Volume Management

**Named Volumes** (persistent data):
- `neo4j_data`: Neo4j database files
- `neo4j_logs`: Neo4j log files
- `backend_venv`: Python virtual environment
- `web_node_modules`: Web frontend dependencies
- `xr_node_modules`: XR frontend dependencies

**Bind Mounts** (hot-reload):
- `./backend/src:/app/src:ro`: Backend source code (read-only)
- `./frontends/web/src:/app/src:ro`: Web frontend source (read-only)
- `./frontends/xr/src:/app/src:ro`: XR frontend source (read-only)

### Network Configuration

All services communicate via `app_network` bridge network:
- Services reference each other by service name (e.g., `neo4j`, `backend`)
- Internal DNS resolution provided by Docker
- External access via published ports

### Health Checks

**Neo4j**:
```yaml
healthcheck:
  test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "password", "RETURN 1"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**Backend**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Design Decisions

### Why FastAPI?

- **Performance**: Async/await support for high concurrency
- **Type Safety**: Pydantic models for request/response validation
- **Documentation**: Automatic OpenAPI/Swagger generation
- **Modern**: Built on modern Python standards (type hints, async)

### Why Neo4j?

- **Graph Model**: Natural representation of relationships (User → Post)
- **Flexibility**: Schema-less, easy to evolve
- **Query Power**: Cypher query language for complex graph traversals
- **Scalability**: Handles complex relationships efficiently

### Why neontology?

- **OGM**: Object-Graph Mapping simplifies Neo4j interactions
- **Type Safety**: Python type hints for graph models
- **Validation**: Pydantic integration for data validation
- **Simplicity**: Reduces boilerplate compared to raw Cypher

### Why JWT?

- **Stateless**: No server-side session storage required
- **Scalable**: Works across multiple backend instances
- **Standard**: Industry-standard authentication mechanism
- **Flexible**: Works for both REST and WebSocket

### Why WebSocket?

- **Real-Time**: Bidirectional communication for instant updates
- **Efficient**: Persistent connection, no polling overhead
- **Standard**: Native browser support, no additional libraries
- **Scalable**: Handles many concurrent connections

### Why React Three Fiber for XR?

- **React Integration**: Familiar React patterns for 3D development
- **WebXR Support**: Native VR/AR support via @react-three/xr
- **Performance**: Efficient Three.js rendering
- **Ecosystem**: Rich ecosystem of helpers and components

### Why Docker Compose?

- **Simplicity**: One-command setup for all services
- **Consistency**: Same environment across development and production
- **Isolation**: Services run in isolated containers
- **Portability**: Works on any platform with Docker

### Why src/ Layout for Backend?

- **Import Safety**: Prevents import bleed from project root
- **Testing Accuracy**: Ensures tests import from installed package
- **Best Practice**: Recommended by Python packaging guides
- **Clarity**: Clear separation of source code and project files

### Why Separate Web and XR Frontends?

- **Independence**: Different build configurations and dependencies
- **Optimization**: Optimize each for its use case
- **Maintainability**: Easier to understand and modify
- **Deployment**: Can deploy independently

## Scalability Considerations

### Horizontal Scaling

**Backend**: Can run multiple instances behind load balancer
- Stateless design (JWT authentication)
- No server-side session storage
- WebSocket requires sticky sessions or Redis pub/sub

**Frontends**: Static files, easily scaled with CDN
- Build once, deploy to multiple servers
- No server-side rendering required

**Neo4j**: Single instance for development, cluster for production
- Neo4j Causal Cluster for high availability
- Read replicas for read-heavy workloads

### Vertical Scaling

**Backend**: Increase uvicorn workers (CPU cores)
- Default: 1 worker for development
- Production: 4+ workers based on CPU cores

**Neo4j**: Increase heap and pagecache memory
- Heap: JVM memory for query execution
- Pagecache: OS memory for data caching

## Security Considerations

### Authentication

- JWT tokens with 40-minute expiration
- Bcrypt password hashing (cost factor 12)
- HTTPS required for production
- Secure token storage (localStorage with XSS protection)

### Authorization

- Protected endpoints require valid JWT
- User can only modify their own resources
- WebSocket connections require authentication

### CORS

- Restricted to specific origins
- Credentials allowed only for authenticated requests
- Production: Update to production domains

### Docker Security

- Non-root users in all containers
- Read-only bind mounts for source code
- No secrets in images or version control
- Environment variables for configuration

## Future Enhancements

### Planned Features

- User profile management and avatars
- Post comments and reactions
- Real-time collaborative editing
- Voice chat in XR environment
- Spatial audio for XR
- Mobile app support

### Infrastructure Improvements

- Kubernetes deployment configurations
- CI/CD pipeline setup
- Monitoring and alerting (Prometheus, Grafana)
- Log aggregation (ELK stack)
- Database backups and disaster recovery

### Performance Optimizations

- Redis caching for frequently accessed data
- CDN for static assets
- Database query optimization
- WebSocket connection pooling
- Load balancing for multiple backend instances

## Conclusion

This architecture provides a solid foundation for building modern web applications with real-time collaboration and immersive experiences. The separation of concerns, type safety, and comprehensive testing ensure maintainability and scalability as the system grows.

For more information:
- [Setup Guide](setup.md) - Installation and configuration
- [API Reference](api.md) - Complete API documentation
- [Development Guide](development.md) - Development workflows
