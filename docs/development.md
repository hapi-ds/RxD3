# Development Guide

This guide covers daily development workflows, adding new features, running tests, troubleshooting common issues, and using helper scripts.

## Table of Contents

- [Daily Development Workflow](#daily-development-workflow)
- [Adding New Features](#adding-new-features)
- [Running Tests](#running-tests)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Helper Scripts](#helper-scripts)
- [Code Style and Standards](#code-style-and-standards)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)

## Daily Development Workflow

### Starting Your Day

1. **Pull Latest Changes**:
   ```bash
   git pull origin main
   ```

2. **Start All Services**:
   ```bash
   docker compose up -d
   ```

3. **Check Service Health**:
   ```bash
   docker compose ps
   ```

4. **View Logs** (optional):
   ```bash
   ./scripts/logs.sh
   ```

### During Development

**Hot-Reload is Enabled**: Code changes automatically trigger reloads:
- **Backend**: Changes to `backend/src/` reload uvicorn
- **Web Frontend**: Changes to `frontends/web/src/` trigger Vite HMR
- **XR Frontend**: Changes to `frontends/xr/src/` trigger Vite HMR

**Making Changes**:
1. Edit code in your preferred editor
2. Save file
3. Wait 1-2 seconds for reload
4. Refresh browser (if needed)
5. Test changes

**Viewing Logs**:
```bash
# All services
./scripts/logs.sh

# Specific service
./scripts/logs.sh backend
./scripts/logs.sh web
./scripts/logs.sh xr
./scripts/logs.sh neo4j
```

### Ending Your Day

**Keep Services Running** (recommended):
```bash
# Services continue running in background
# No action needed
```

**Stop Services** (if needed):
```bash
docker compose down
# Data is preserved in volumes
```

**Stop and Clean** (fresh start next time):
```bash
./scripts/clean.sh
# Follow prompts to remove volumes
```

## Adding New Features

### Backend Feature Development

#### 1. Create Data Model

Add a new Neo4j node or relationship in `backend/src/models/`:

```python
# backend/src/models/comment.py
from neontology import BaseNode, BaseRelationship
from pydantic import Field
from uuid import uuid4
from datetime import datetime

class CommentNode(BaseNode):
    """Represents a comment on a post."""
    __primarylabel__ = "Comment"
    __primaryproperty__ = "id"
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    content: str
    date_created: datetime = Field(default_factory=datetime.now)
    date_updated: datetime = Field(set_on_update=True)

class CommentedOn(BaseRelationship):
    """User commented on a post."""
    __relationshiptype__ = "COMMENTED_ON"
    
    source: UserNode  # from models.user
    target: PosteNode  # from models.post
```

#### 2. Create Request/Response Schemas

Add Pydantic schemas in `backend/src/schemas/`:

```python
# backend/src/schemas/comments.py
from pydantic import BaseModel
from datetime import datetime

class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str
    post_id: str

class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: str

class CommentResponse(BaseModel):
    """Schema for comment response."""
    id: str
    content: str
    date_created: datetime
    date_updated: datetime
    author_email: str
```

#### 3. Create API Endpoints

Add routes in `backend/src/routes/`:

```python
# backend/src/routes/comments.py
from fastapi import APIRouter, Depends, HTTPException
from src.auth.jwt_bearer import JWTBearer
from src.schemas.comments import CommentCreate, CommentUpdate, CommentResponse
from src.models.comment import CommentNode, CommentedOn
from src.models.user import UserNode
from src.models.post import PosteNode

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/", response_model=CommentResponse, status_code=201)
async def create_comment(
    comment: CommentCreate,
    token: str = Depends(JWTBearer())
):
    """Create a new comment on a post."""
    # Get current user
    user = UserNode.match_by_email(token["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get post
    post = PosteNode.match_by_id(comment.post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create comment
    new_comment = CommentNode(content=comment.content)
    new_comment.create()
    
    # Create relationship
    relationship = CommentedOn(source=user, target=post)
    relationship.create()
    
    return CommentResponse(
        id=new_comment.id,
        content=new_comment.content,
        date_created=new_comment.date_created,
        date_updated=new_comment.date_updated,
        author_email=user.email
    )

@router.get("/{post_id}", response_model=list[CommentResponse])
async def get_comments(
    post_id: str,
    token: str = Depends(JWTBearer())
):
    """Get all comments for a post."""
    # Implementation here
    pass
```

#### 4. Register Router

Add router to `backend/src/app.py`:

```python
from src.routes import users, posts, comments

app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)  # Add this line
```

#### 5. Write Tests

Add tests in `backend/tests/`:

```python
# backend/tests/test_comments.py
import pytest
from fastapi.testclient import TestClient

def test_create_comment(test_client, auth_token):
    """Test creating a comment."""
    # Create a post first
    post_response = test_client.post(
        "/posts",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"title": "Test Post", "content": "Content", "tags": []}
    )
    post_id = post_response.json()["id"]
    
    # Create comment
    response = test_client.post(
        "/comments",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"content": "Great post!", "post_id": post_id}
    )
    
    assert response.status_code == 201
    assert response.json()["content"] == "Great post!"

def test_get_comments(test_client, auth_token):
    """Test getting comments for a post."""
    # Implementation here
    pass
```

#### 6. Run Tests

```bash
cd backend
uv run pytest -q
```

### Frontend Feature Development

#### 1. Create Component

Add component in `frontends/web/src/components/`:

```typescript
// frontends/web/src/components/CommentList.tsx
import { useState, useEffect } from 'react';
import { commentsAPI } from '../services/api';

interface Comment {
  id: string;
  content: string;
  author_email: string;
  date_created: string;
}

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await commentsAPI.list(postId);
        setComments(response.data);
      } catch (err) {
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  if (loading) return <div>Loading comments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="comment-list">
      <h3>Comments ({comments.length})</h3>
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <p>{comment.content}</p>
          <small>By {comment.author_email} on {new Date(comment.date_created).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

#### 2. Add API Service

Update `frontends/web/src/services/api.ts`:

```typescript
export const commentsAPI = {
  list: (postId: string) => api.get(`/comments/${postId}`),
  create: (postId: string, content: string) => 
    api.post('/comments', { post_id: postId, content }),
  update: (commentId: string, content: string) => 
    api.put(`/comments/${commentId}`, { content }),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};
```

#### 3. Write Tests

Add tests in `frontends/web/tests/`:

```typescript
// frontends/web/tests/CommentList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CommentList } from '../src/components/CommentList';
import { vi } from 'vitest';

vi.mock('../src/services/api', () => ({
  commentsAPI: {
    list: vi.fn(() => Promise.resolve({
      data: [
        { id: '1', content: 'Great post!', author_email: 'user@example.com', date_created: '2024-01-15T10:00:00Z' }
      ]
    }))
  }
}));

describe('CommentList', () => {
  it('should render comments', async () => {
    render(<CommentList postId="post-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });
  });
});
```

#### 4. Run Tests

```bash
cd frontends/web
npm test -- --run
```

## Running Tests

### All Tests

Run all tests across all services:

```bash
./scripts/test.sh
```

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest -q

# Run specific test file
uv run pytest tests/test_comments.py -v

# Run specific test
uv run pytest tests/test_comments.py::test_create_comment -v

# Run with coverage
uv run pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Web Frontend Tests

```bash
cd frontends/web

# Run all tests
npm test -- --run

# Run in watch mode (development)
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- CommentList.test.tsx
```

### XR Frontend Tests

```bash
cd frontends/xr

# Run all tests
npm test -- --run

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run integration test script
./test_integration.sh
```

## Common Issues and Solutions

### Issue: Port Already in Use

**Symptoms**: Error "port is already allocated" when starting services

**Solutions**:
1. Check what's using the port:
   ```bash
   lsof -i :8080  # Backend
   lsof -i :3000  # Web frontend
   lsof -i :3001  # XR frontend
   lsof -i :7474  # Neo4j HTTP
   lsof -i :7687  # Neo4j Bolt
   ```

2. Stop the conflicting process:
   ```bash
   kill -9 <PID>
   ```

3. Or change the port in `docker-compose.yml`

### Issue: Hot-Reload Not Working

**Symptoms**: Code changes don't trigger reload

**Solutions**:

**Backend**:
1. Check uvicorn is running with `--reload`:
   ```bash
   docker compose logs backend | grep reload
   ```

2. Verify volume mount:
   ```bash
   docker compose config | grep -A 5 backend
   ```

3. Restart backend:
   ```bash
   docker compose restart backend
   ```

**Frontend**:
1. Check Vite dev server is running:
   ```bash
   docker compose logs web
   ```

2. Verify volume mount and node_modules:
   ```bash
   docker compose config | grep -A 10 web
   ```

3. Restart frontend:
   ```bash
   docker compose restart web
   ```

### Issue: Database Connection Failed

**Symptoms**: Backend can't connect to Neo4j

**Solutions**:
1. Check Neo4j is healthy:
   ```bash
   docker compose ps neo4j
   ```

2. Wait for Neo4j to be ready:
   ```bash
   docker compose logs neo4j | grep "Started"
   ```

3. Verify credentials in `.env`:
   ```bash
   cat .env | grep NEO4J
   ```

4. Restart backend after Neo4j is ready:
   ```bash
   docker compose restart backend
   ```

### Issue: Frontend Can't Connect to Backend

**Symptoms**: CORS errors or connection refused

**Solutions**:
1. Verify backend is running:
   ```bash
   curl http://localhost:8080/
   ```

2. Check CORS configuration in `backend/src/app.py`:
   ```python
   allow_origins=[
       "http://localhost:3000",
       "http://localhost:3001",
   ]
   ```

3. Verify `VITE_API_URL` in `.env`:
   ```bash
   cat .env | grep VITE_API_URL
   ```

4. Check browser console for specific errors

### Issue: Tests Failing

**Symptoms**: Tests that previously passed now fail

**Solutions**:

**Backend**:
1. Clear pytest cache:
   ```bash
   cd backend
   rm -rf .pytest_cache
   uv run pytest -q
   ```

2. Check database state:
   ```bash
   # Reset database
   docker compose down -v
   docker compose up -d
   ```

**Frontend**:
1. Clear node_modules and reinstall:
   ```bash
   cd frontends/web
   rm -rf node_modules
   npm install
   npm test -- --run
   ```

2. Update snapshots (if using):
   ```bash
   npm test -- -u
   ```

### Issue: Docker Build Fails

**Symptoms**: `docker compose build` fails

**Solutions**:
1. Clear Docker cache:
   ```bash
   docker builder prune -a
   ```

2. Rebuild without cache:
   ```bash
   docker compose build --no-cache
   ```

3. Check Dockerfile syntax:
   ```bash
   docker compose config
   ```

4. Verify base images are available:
   ```bash
   docker pull python:3.13-slim
   docker pull node:20-alpine
   docker pull neo4j:5.15-community
   ```

### Issue: Out of Disk Space

**Symptoms**: Docker operations fail with "no space left on device"

**Solutions**:
1. Remove unused Docker resources:
   ```bash
   docker system prune -a --volumes
   ```

2. Check disk usage:
   ```bash
   docker system df
   ```

3. Remove old images:
   ```bash
   docker image prune -a
   ```

## Helper Scripts

### setup.sh

**Purpose**: Initial project setup and service startup

**Usage**:
```bash
./scripts/setup.sh
```

**What it does**:
- Checks prerequisites (Docker, Docker Compose)
- Creates `.env` from `.env.example`
- Pulls base Docker images
- Builds all services
- Starts all services
- Waits for services to be healthy
- Displays service URLs

**When to use**:
- First time setup
- After cloning repository
- After major configuration changes

### test.sh

**Purpose**: Run all tests across all services

**Usage**:
```bash
./scripts/test.sh
```

**What it does**:
- Runs backend tests with pytest
- Runs web frontend tests with npm
- Runs XR frontend tests with npm
- Displays summary of results

**When to use**:
- Before committing code
- Before creating pull request
- After adding new features
- During CI/CD pipeline

### clean.sh

**Purpose**: Stop services and clean build artifacts

**Usage**:
```bash
./scripts/clean.sh
```

**What it does**:
- Stops all Docker containers
- Prompts to remove volumes (optional)
- Removes Python build artifacts (__pycache__, .pyc)
- Removes Node.js build artifacts (node_modules, dist)
- Removes log files

**When to use**:
- Fresh start needed
- Disk space cleanup
- Troubleshooting build issues
- Before major updates

**Note**: Removing volumes deletes database data!

### logs.sh

**Purpose**: View logs from Docker services

**Usage**:
```bash
# All services
./scripts/logs.sh

# Specific service
./scripts/logs.sh backend
./scripts/logs.sh web
./scripts/logs.sh xr
./scripts/logs.sh neo4j
```

**What it does**:
- Displays real-time logs from services
- Follows log output (Ctrl+C to stop)
- Color-coded by service

**When to use**:
- Debugging issues
- Monitoring service behavior
- Checking for errors
- Understanding request flow

## Code Style and Standards

### Backend (Python)

**Style Guide**: PEP 8

**Type Hints**: Required for all functions
```python
def create_user(email: str, password: str) -> UserNode:
    """Create a new user."""
    pass
```

**Docstrings**: Google style
```python
def sign_jwt(email: str) -> dict[str, str]:
    """Generate JWT token for authenticated user.
    
    Args:
        email: User's email address
        
    Returns:
        Dictionary with access_token and type
        
    Raises:
        ValueError: If email is invalid
    """
    pass
```

**Linting**: Use ruff
```bash
cd backend
uv run ruff check src/
uv run ruff format src/
```

**Testing**: pytest with fixtures
```python
@pytest.fixture
def test_user():
    """Create a test user."""
    return UserNode(email="test@example.com", password="hashed", fullname="Test")

def test_create_post(test_user):
    """Test post creation."""
    pass
```

### Frontend (TypeScript/React)

**Style Guide**: Airbnb TypeScript

**Type Safety**: Strict mode enabled
```typescript
interface User {
  id: string;
  email: string;
  fullname: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}
```

**Component Style**: Functional components with hooks
```typescript
export function MyComponent({ prop }: MyComponentProps) {
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return <div>{state}</div>;
}
```

**Named Exports**: Prefer over default exports
```typescript
// Good
export function MyComponent() {}

// Avoid
export default function MyComponent() {}
```

**Testing**: React Testing Library
```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Debugging

### Backend Debugging

**Add Debug Logging**:
```python
import logging

logger = logging.getLogger(__name__)

def my_function():
    logger.debug("Debug message")
    logger.info("Info message")
    logger.error("Error message")
```

**Interactive Debugging**:
```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use ipdb for better experience
import ipdb; ipdb.set_trace()
```

**View Logs**:
```bash
./scripts/logs.sh backend
```

### Frontend Debugging

**Browser DevTools**:
- Open DevTools (F12)
- Console tab for logs
- Network tab for API requests
- React DevTools for component inspection

**Add Console Logs**:
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
console.table(arrayOfObjects);
```

**React DevTools**:
- Install React DevTools browser extension
- Inspect component props and state
- Profile component performance

### Database Debugging

**Neo4j Browser**:
1. Visit http://localhost:7474
2. Login with credentials from `.env`
3. Run Cypher queries:
   ```cypher
   // View all users
   MATCH (u:User) RETURN u
   
   // View all posts with authors
   MATCH (u:User)-[:POSTED]->(p:Poste) RETURN u, p
   
   // Count nodes
   MATCH (n) RETURN labels(n), count(n)
   ```

**Check Database Connection**:
```bash
docker compose exec neo4j cypher-shell -u neo4j -p password "RETURN 1"
```

## Performance Optimization

### Backend Optimization

**Database Queries**:
- Use indexes for frequently queried properties
- Batch operations when possible
- Avoid N+1 queries

**Async Operations**:
```python
# Use async/await for I/O operations
async def get_posts():
    posts = await PosteNode.match_all()
    return posts
```

**Caching** (future enhancement):
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_user_by_email(email: str):
    return UserNode.match_by_email(email)
```

### Frontend Optimization

**Code Splitting**:
```typescript
// Lazy load components
const CommentList = lazy(() => import('./components/CommentList'));
```

**Memoization**:
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**Component Optimization**:
```typescript
// Prevent unnecessary re-renders
export const MyComponent = memo(function MyComponent({ prop }: Props) {
  return <div>{prop}</div>;
});
```

### Docker Optimization

**Multi-stage Builds**: Already implemented in Dockerfiles

**Layer Caching**:
- Order Dockerfile commands from least to most frequently changing
- Copy dependency files before source code

**Volume Performance**:
- Use named volumes for node_modules and venv
- Avoid bind mounts for dependencies

## Next Steps

After mastering these workflows:

1. **Explore Advanced Features**:
   - WebSocket real-time features
   - XR frontend development
   - Graph database queries

2. **Read Additional Documentation**:
   - [Architecture Guide](architecture.md) - System design
   - [API Reference](api.md) - Complete API docs
   - [Setup Guide](setup.md) - Installation details

3. **Contribute**:
   - Fix bugs
   - Add features
   - Improve documentation
   - Write tests

## Getting Help

If you encounter issues:

1. Check this guide for common solutions
2. Review service logs: `./scripts/logs.sh <service>`
3. Check [Setup Guide](setup.md) for configuration
4. Search GitHub issues
5. Open new issue with details

Happy coding! 🚀
