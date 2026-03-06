from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from src.auth.deps import get_current_user
from src.auth.jwt_handler import decode_jwt
from src.models.post import Posted, PosteNode
from src.models.user import UserNode
from src.schemas.posts import PostCreate, PostResponse, PostUpdate

PostRouter = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


@PostRouter.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=PostResponse,
    summary="Create a new post",
    description="""
    Create a new post with title, content, and optional tags.

    **Authentication Required:** Yes (JWT Bearer token)

    **Requirements:**
    - User must be authenticated
    - Title must not be empty (max 200 characters)
    - Content must not be empty
    - Tags are optional (array of strings)

    **Returns:**
    - Created post object with id, timestamps, and all fields

    **Errors:**
    - 403 Forbidden: Invalid or expired token
    """,
    responses={
        201: {
            "description": "Post successfully created",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "Getting Started with FastAPI",
                        "content": "FastAPI is a modern, fast web framework...",
                        "tags": ["python", "fastapi", "tutorial"],
                        "date_created": "2024-01-15T10:30:00Z",
                        "date_updated": "2024-01-15T10:30:00Z",
                    }
                }
            },
        },
        403: {
            "description": "Authentication failed",
            "content": {"application/json": {"example": {"detail": "invalide token credentials"}}},
        },
    },
)
def add_new_post(post: PostCreate, token=Depends(oauth2_scheme)):
    """Create a new post."""
    user_exists = decode_jwt(token=token)

    if user_exists is None:
        raise HTTPException(status_code=403, detail="invalide token  credentials")

    email = user_exists.get("email")
    if email is None:
        raise HTTPException(status_code=403, detail="Invalid token payload")

    users_exist = UserNode.match(email)

    if not users_exist:
        raise HTTPException(status_code=403, detail="invalide token credentials")

    post_created = PosteNode(title=post.title, tags=post.tags, content=post.content)
    post_obj = post_created.create()

    posted = Posted(source=users_exist, target=post_obj)
    posted.merge()

    return PostResponse(
        id=str(post_obj.id),
        title=post_obj.title,
        content=post_obj.content,
        tags=post_obj.tags,
        date_created=post_obj.date_created,
        date_updated=post_obj.date_updated,
    )


@PostRouter.get(
    "",
    response_model=List[PostResponse],
    summary="Get all posts",
    description="""
    Retrieve a list of all posts in the system.

    **Authentication Required:** Yes (JWT Bearer token)

    **Returns:**
    - Array of post objects with all fields
    - Empty array if no posts exist

    **Errors:**
    - 403 Forbidden: Invalid or expired token
    """,
    responses={
        200: {
            "description": "List of all posts",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "title": "Getting Started with FastAPI",
                            "content": "FastAPI is a modern, fast web framework...",
                            "tags": ["python", "fastapi", "tutorial"],
                            "date_created": "2024-01-15T10:30:00Z",
                            "date_updated": "2024-01-15T10:30:00Z",
                        },
                        {
                            "id": "660e8400-e29b-41d4-a716-446655440001",
                            "title": "Neo4j Graph Database",
                            "content": "Neo4j is a powerful graph database...",
                            "tags": ["neo4j", "database", "graph"],
                            "date_created": "2024-01-16T14:20:00Z",
                            "date_updated": "2024-01-16T14:20:00Z",
                        },
                    ]
                }
            },
        },
        403: {
            "description": "Authentication failed",
            "content": {"application/json": {"example": {"detail": "invalide token credentials"}}},
        },
    },
)
def get_all_post(token=Depends(oauth2_scheme)) -> List[PostResponse]:
    """Get all posts."""
    user = decode_jwt(token=token)

    if user is None:
        raise HTTPException(status_code=403, detail="invalide token  credentials")

    email = user.get("email")
    if email is None:
        raise HTTPException(status_code=403, detail="Invalid token payload")

    users_exist = UserNode.match(email)

    if not users_exist:
        raise HTTPException(status_code=403, detail="invalide token  credentials")

    posts = PosteNode.match_nodes()
    return [
        PostResponse(
            id=str(p.id),
            title=p.title,
            content=p.content,
            tags=p.tags,
            date_created=p.date_created,
            date_updated=p.date_updated,
        )
        for p in posts
    ]


@PostRouter.put(
    "/{post_uuid}",
    response_model=PostResponse,
    summary="Update a post",
    description="""
    Update an existing post's title, content, and/or tags.

    **Authentication Required:** Yes (JWT Bearer token)

    **Requirements:**
    - User must be authenticated
    - Post must exist
    - Title must not be empty (max 200 characters)
    - Content must not be empty

    **Returns:**
    - Updated post object with new date_updated timestamp

    **Errors:**
    - 403 Forbidden: Invalid or expired token
    - 404 Not Found: Post does not exist
    """,
    responses={
        200: {
            "description": "Post successfully updated",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "Getting Started with FastAPI - Updated",
                        "content": "FastAPI is a modern, fast web framework... (updated content)",
                        "tags": ["python", "fastapi", "tutorial", "updated"],
                        "date_created": "2024-01-15T10:30:00Z",
                        "date_updated": "2024-01-15T16:45:00Z",
                    }
                }
            },
        },
        404: {
            "description": "Post not found",
            "content": {"application/json": {"example": {"detail": "The POST does not exist"}}},
        },
    },
)
def update_post(
    post_uuid: str, post_update: PostUpdate, user: UserNode = Depends(get_current_user)
):
    """Update a post."""
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The user does not exist")

    post = PosteNode.match(post_uuid)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The POST does not exist")

    post.title = post_update.title
    post.content = post_update.content
    post.tags = post_update.tags
    post.merge()

    return PostResponse(
        id=str(post.id),
        title=post.title,
        content=post.content,
        tags=post.tags,
        date_created=post.date_created,
        date_updated=post.date_updated,
    )


@PostRouter.delete(
    "/{post_uuid}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a post",
    description="""
    Delete an existing post.

    **Authentication Required:** Yes (JWT Bearer token)

    **Requirements:**
    - User must be authenticated
    - Post must exist

    **Returns:**
    - 204 No Content on success

    **Errors:**
    - 403 Forbidden: Invalid or expired token
    - 404 Not Found: User does not exist
    """,
    responses={
        204: {"description": "Post successfully deleted"},
        403: {
            "description": "Authentication failed",
            "content": {
                "application/json": {"example": {"detail": "Invalid authentication token"}}
            },
        },
        404: {
            "description": "User not found",
            "content": {"application/json": {"example": {"detail": "The user does not exist"}}},
        },
    },
)
def delete_post(post_uuid: str, user: UserNode = Depends(get_current_user)):
    """Delete a post."""
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The user does not exist")

    PosteNode.delete(post_uuid)
    return HTTPException(
        status_code=status.HTTP_204_NO_CONTENT, detail=f"User with {post_uuid} was deleting"
    )
