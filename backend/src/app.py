import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database.database import initiate_database
from src.routes.posts import PostRouter
from src.routes.users import UserRouter
from src.websocket.routes import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    initiate_database()
    yield
    # You can also close DB connections here if needed
    print("App shutdown complete.")


app = FastAPI(
    title="FastAPI Neo4j Multi-Frontend System",
    version="1.0.0",
    description="""
## Multi-Frontend System API

A high-performance FastAPI backend with Neo4j graph database, supporting multiple frontend clients
(web and XR/VR) with real-time WebSocket communication.

### Features

* **JWT Authentication**: Secure token-based authentication for REST and WebSocket endpoints
* **User Management**: Complete CRUD operations for user accounts
* **Post Management**: Create, read, update, and delete posts with tagging support
* **Real-time Communication**: WebSocket support for instant messaging between clients
* **Graph Database**: Neo4j for powerful relationship modeling

### Authentication

Most endpoints require JWT authentication. To authenticate:

1. Register a new user via `POST /users` or use existing credentials
2. Login via `POST /users/login` to receive a JWT access token
3. Include the token in the `Authorization` header as `Bearer <token>` for subsequent requests
4. For WebSocket connections, pass the token as a query parameter: `/ws?token=<token>`

Tokens expire after 40 minutes. You'll need to login again to get a fresh token.
    """,
    contact={"name": "API Support", "email": "samanidarix@gmail.com"},
    license_info={
        "name": "MIT",
    },
    openapi_tags=[
        {"name": "Root", "description": "Health check and welcome endpoints"},
        {
            "name": "Administrator",
            "description": "User management operations including registration, login, and profile updates",
        },
        {
            "name": "Posts",
            "description": "Post management operations for creating and managing content",
        },
        {
            "name": "WebSocket",
            "description": "Real-time communication endpoints for instant messaging",
        },
    ],
    lifespan=lifespan,
)

# CORS middleware for multiple frontends
app.add_middleware(CORSMiddleware)  # type: ignore[arg-type]


FORMAT = "%(levelname)s: %(asctime)-15s: %(filename)s: %(funcName)s: %(module)s: %(message)s"
logging.basicConfig(filename="example.log", encoding="utf-8", level=logging.DEBUG, format=FORMAT)


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to this fantastic app."}


app.include_router(UserRouter, tags=["Administrator"], prefix="/users")
app.include_router(PostRouter, tags=["Posts"], prefix="/posts")
app.include_router(websocket_router, tags=["WebSocket"])
