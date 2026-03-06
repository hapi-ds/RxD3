# API Reference

Complete documentation for all REST and WebSocket endpoints in the FastAPI Neo4j Multi-Frontend System.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [REST API Endpoints](#rest-api-endpoints)
  - [Health Check](#health-check)
  - [User Endpoints](#user-endpoints)
  - [Post Endpoints](#post-endpoints)
- [WebSocket API](#websocket-api)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

## Base URL

**Development**: `http://localhost:8080`
**Production**: `https://api.yourdomain.com`

## Authentication

The API uses JWT (JSON Web Token) authentication for protected endpoints.

### Getting a Token

1. Register a new user or use existing credentials
2. Call `POST /users/login` with email and password
3. Receive JWT token in response
4. Include token in subsequent requests

### Using the Token

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration

- Tokens expire after 40 minutes
- Expired tokens return 403 Forbidden
- Client should handle token refresh or re-login

### Protected Endpoints

Endpoints marked with 🔒 require authentication.

---

## REST API Endpoints

### Health Check

#### GET /

Check if the API is running.

**Authentication**: None

**Request**:
```bash
curl http://localhost:8080/
```

**Response** (200 OK):
```json
{
  "message": "Welcome to the FastAPI Neo4j Multi-Frontend System API"
}
```

---

### User Endpoints

#### POST /users

Register a new user.

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullname": "John Doe"
}
```

**Field Validation**:
- `email`: Valid email format, unique
- `password`: Minimum 8 characters
- `fullname`: Non-empty string

**Example Request**:
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "mypassword123",
    "fullname": "John Doe"
  }'
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "fullname": "John Doe"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format or missing fields
- `409 Conflict`: Email already exists

---

#### POST /users/login

Authenticate and receive JWT token.

**Authentication**: None

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "securepassword123"
}
```

**Note**: Field is named `username` but expects email address (OAuth2 standard).

**Example Request**:
```bash
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john@example.com",
    "password": "mypassword123"
  }'
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer"
}
```

**Token Payload** (decoded):
```json
{
  "email": "john@example.com",
  "expires": 1705320000
}
```

**Error Responses**:
- `403 Forbidden`: Incorrect email or password
- `400 Bad Request`: Missing fields

---

#### PUT /users/{uuid} 🔒

Update user information.

**Authentication**: Required (JWT)

**Path Parameters**:
- `uuid`: User ID (UUID format)

**Request Body**:
```json
{
  "password": "newsecurepassword456",
  "fullname": "John Smith"
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpassword456",
    "fullname": "John Smith"
  }'
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "fullname": "John Smith"
}
```

**Error Responses**:
- `403 Forbidden`: Invalid or expired token
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid data

---

#### DELETE /users/{uuid} 🔒

Delete a user account.

**Authentication**: Required (JWT)

**Path Parameters**:
- `uuid`: User ID (UUID format)

**Example Request**:
```bash
curl -X DELETE http://localhost:8080/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses**:
- `403 Forbidden`: Invalid or expired token
- `404 Not Found`: User not found

---

### Post Endpoints

#### POST /posts 🔒

Create a new post.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "title": "My First Post",
  "content": "This is the content of my post. It can be quite long.",
  "tags": ["introduction", "hello-world"]
}
```

**Field Validation**:
- `title`: Non-empty string, max 200 characters
- `content`: Non-empty string
- `tags`: Array of strings (optional, default: [])

**Example Request**:
```bash
curl -X POST http://localhost:8080/posts \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Neo4j",
    "content": "Neo4j is a powerful graph database...",
    "tags": ["neo4j", "database", "tutorial"]
  }'
```

**Response** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Getting Started with Neo4j",
  "content": "Neo4j is a powerful graph database...",
  "tags": ["neo4j", "database", "tutorial"],
  "date_created": "2024-01-15T10:30:00Z",
  "date_updated": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `403 Forbidden`: Invalid or expired token
- `400 Bad Request`: Invalid data or missing fields

---

#### GET /posts 🔒

List all posts.

**Authentication**: Required (JWT)

**Query Parameters**: None

**Example Request**:
```bash
curl -X GET http://localhost:8080/posts \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Getting Started with Neo4j",
    "content": "Neo4j is a powerful graph database...",
    "tags": ["neo4j", "database", "tutorial"],
    "date_created": "2024-01-15T10:30:00Z",
    "date_updated": "2024-01-15T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "title": "FastAPI Best Practices",
    "content": "Here are some tips for building great APIs...",
    "tags": ["fastapi", "python", "api"],
    "date_created": "2024-01-16T14:20:00Z",
    "date_updated": "2024-01-16T14:20:00Z"
  }
]
```

**Error Responses**:
- `403 Forbidden`: Invalid or expired token

---

#### PUT /posts/{uuid} 🔒

Update an existing post.

**Authentication**: Required (JWT)

**Path Parameters**:
- `uuid`: Post ID (UUID format)

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content goes here...",
  "tags": ["updated", "modified"]
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:8080/posts/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Neo4j (Updated)",
    "content": "Neo4j is a powerful graph database. Updated content...",
    "tags": ["neo4j", "database", "tutorial", "updated"]
  }'
```

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Getting Started with Neo4j (Updated)",
  "content": "Neo4j is a powerful graph database. Updated content...",
  "tags": ["neo4j", "database", "tutorial", "updated"],
  "date_created": "2024-01-15T10:30:00Z",
  "date_updated": "2024-01-17T09:15:00Z"
}
```

**Note**: `date_updated` is automatically set to current timestamp.

**Error Responses**:
- `403 Forbidden`: Invalid or expired token
- `404 Not Found`: Post not found
- `400 Bad Request`: Invalid data

---

#### DELETE /posts/{uuid} 🔒

Delete a post.

**Authentication**: Required (JWT)

**Path Parameters**:
- `uuid`: Post ID (UUID format)

**Example Request**:
```bash
curl -X DELETE http://localhost:8080/posts/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response** (200 OK):
```json
{
  "message": "Post deleted successfully"
}
```

**Error Responses**:
- `403 Forbidden`: Invalid or expired token
- `404 Not Found`: Post not found

---

## WebSocket API

### GET /ws

Establish WebSocket connection for real-time messaging.

**Authentication**: Required (JWT via query parameter)

**Connection URL**:
```
ws://localhost:8080/ws?token=<your-jwt-token>
```

### Connection Flow

1. **Client Initiates Connection**:
   ```javascript
   const token = localStorage.getItem('token');
   const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
   ```

2. **Server Validates Token**:
   - Extracts token from query parameter
   - Calls `decode_jwt(token)` to validate
   - If valid: Accepts connection and registers user
   - If invalid: Closes connection with 403 status

3. **Connection Established**:
   - User added to active connections registry
   - Other users notified of new connection

### Message Protocol

#### Client → Server (Send Message)

**Format**:
```json
{
  "type": "message",
  "content": "Hello, everyone!"
}
```

**Example**:
```javascript
ws.send(JSON.stringify({
  type: "message",
  content: "Hello, everyone!"
}));
```

#### Server → Client (Broadcast Message)

**Format**:
```json
{
  "type": "message",
  "sender": "john@example.com",
  "content": "Hello, everyone!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Fields**:
- `type`: Always "message" for chat messages
- `sender`: Email of the user who sent the message
- `content`: Message text
- `timestamp`: ISO 8601 timestamp

**Example**:
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`${message.sender}: ${message.content}`);
};
```

#### Server → Client (User Joined)

**Format**:
```json
{
  "type": "user_event",
  "event": "joined",
  "email": "alice@example.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Fields**:
- `type`: Always "user_event" for user events
- `event`: "joined" or "left"
- `email`: Email of the user who joined/left
- `timestamp`: ISO 8601 timestamp

#### Server → Client (User Left)

**Format**:
```json
{
  "type": "user_event",
  "event": "left",
  "email": "alice@example.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Connection Lifecycle

1. **Connect**: Client connects with JWT token
2. **Authenticate**: Server validates token
3. **Register**: Server adds to active connections
4. **Notify**: Server broadcasts user joined event
5. **Communicate**: Client sends/receives messages
6. **Disconnect**: Client closes connection or network fails
7. **Cleanup**: Server removes from active connections
8. **Notify**: Server broadcasts user left event

### Error Handling

**Invalid Token**:
- Connection closed with status 403
- Client should re-authenticate and retry

**Connection Lost**:
- Client should implement reconnection logic
- Exponential backoff recommended (5s, 10s, 20s, ...)

**Message Parse Error**:
- Server logs error
- Invalid message ignored
- Connection remains open

### Complete WebSocket Example

```javascript
class WebSocketClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(`ws://localhost:8080/ws?token=${this.token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'message') {
        console.log(`${message.sender}: ${message.content}`);
      } else if (message.type === 'user_event') {
        console.log(`User ${message.email} ${message.event}`);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code);
      
      if (event.code === 403) {
        console.error('Authentication failed');
        // Re-login required
      } else {
        // Attempt reconnection
        this.reconnect();
      }
    };
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  sendMessage(content) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        content: content
      }));
    } else {
      console.error('WebSocket not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const token = localStorage.getItem('token');
const client = new WebSocketClient(token);
client.connect();

// Send message
client.sendMessage('Hello, everyone!');

// Disconnect
client.disconnect();
```

---

## Error Responses

All error responses follow a consistent format:

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input data, missing required fields |
| 401 | Unauthorized | Missing authentication token |
| 403 | Forbidden | Invalid or expired token, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation error (Pydantic) |
| 500 | Internal Server Error | Unexpected server error |

### Common Error Examples

#### 400 Bad Request

**Request**:
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'
```

**Response**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "password"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### 403 Forbidden (Invalid Token)

**Request**:
```bash
curl -X GET http://localhost:8080/posts \
  -H "Authorization: Bearer invalid-token"
```

**Response**:
```json
{
  "detail": "Invalid authentication token"
}
```

#### 403 Forbidden (Expired Token)

**Response**:
```json
{
  "detail": "Invalid token or expired token"
}
```

#### 404 Not Found

**Request**:
```bash
curl -X GET http://localhost:8080/posts/nonexistent-uuid \
  -H "Authorization: Bearer <valid-token>"
```

**Response**:
```json
{
  "detail": "Post not found"
}
```

#### 409 Conflict (Duplicate Email)

**Request**:
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "password123",
    "fullname": "John Doe"
  }'
```

**Response**:
```json
{
  "detail": "User with this email already exists"
}
```

---

## Rate Limiting

Currently, the API does not implement rate limiting. For production deployments, consider:

- **API Gateway**: Use nginx or Traefik with rate limiting
- **Application Level**: Implement rate limiting middleware
- **Recommended Limits**:
  - Authentication endpoints: 5 requests per minute per IP
  - General endpoints: 100 requests per minute per user
  - WebSocket connections: 10 connections per user

---

## Interactive Documentation

The API provides interactive documentation at:

- **Swagger UI**: http://localhost:8080/docs
  - Test endpoints directly in browser
  - View request/response schemas
  - Try authentication flow

- **ReDoc**: http://localhost:8080/redoc
  - Clean, readable documentation
  - Searchable endpoint list
  - Detailed schema information

### Using Swagger UI

1. Visit http://localhost:8080/docs
2. Click "Authorize" button (top right)
3. Login via `POST /users/login` to get token
4. Enter token in format: `Bearer <your-token>`
5. Click "Authorize"
6. Test protected endpoints

---

## SDK Examples

### Python

```python
import requests

class APIClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.token = None
    
    def login(self, email, password):
        response = requests.post(
            f"{self.base_url}/users/login",
            json={"username": email, "password": password}
        )
        response.raise_for_status()
        self.token = response.json()["access_token"]
        return self.token
    
    def get_posts(self):
        response = requests.get(
            f"{self.base_url}/posts",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()
    
    def create_post(self, title, content, tags=None):
        response = requests.post(
            f"{self.base_url}/posts",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"title": title, "content": content, "tags": tags or []}
        )
        response.raise_for_status()
        return response.json()

# Usage
client = APIClient()
client.login("user@example.com", "password123")
posts = client.get_posts()
new_post = client.create_post("My Post", "Content here", ["tag1"])
```

### JavaScript/TypeScript

```typescript
class APIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    this.token = data.access_token;
    return this.token;
  }

  async getPosts(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/posts`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch posts');
    
    return response.json();
  }

  async createPost(title: string, content: string, tags: string[] = []): Promise<any> {
    const response = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content, tags })
    });
    
    if (!response.ok) throw new Error('Failed to create post');
    
    return response.json();
  }
}

// Usage
const client = new APIClient();
await client.login('user@example.com', 'password123');
const posts = await client.getPosts();
const newPost = await client.createPost('My Post', 'Content here', ['tag1']);
```

---

## Postman Collection

A Postman collection is available for testing the API. Import the collection and set the following environment variables:

- `base_url`: http://localhost:8080
- `token`: (will be set automatically after login)

**Collection Structure**:
- Authentication
  - Register User
  - Login
- Users
  - Update User
  - Delete User
- Posts
  - Create Post
  - List Posts
  - Update Post
  - Delete Post

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- User registration and authentication
- Post CRUD operations
- WebSocket real-time messaging
- JWT authentication for REST and WebSocket

### Planned Features

- User profile endpoints (GET /users/{uuid})
- Post search and filtering (GET /posts?search=query)
- Post pagination (GET /posts?page=1&limit=10)
- User avatar upload
- Post comments
- Post reactions (likes, etc.)
- Rate limiting
- API versioning (v2)

---

## Support

For API issues or questions:

- **Documentation**: Check this guide and [Architecture](architecture.md)
- **Interactive Docs**: http://localhost:8080/docs
- **GitHub Issues**: Report bugs or request features
- **Development Guide**: See [Development](development.md) for local setup

---

## Summary

This API provides:
- ✓ RESTful endpoints for users and posts
- ✓ JWT authentication for security
- ✓ WebSocket for real-time communication
- ✓ Comprehensive error handling
- ✓ Interactive documentation
- ✓ Type-safe request/response validation

Ready to build! Check out the [Development Guide](development.md) for integration examples.
