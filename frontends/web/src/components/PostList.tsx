/**
 * PostList Component
 * Displays a list of posts with edit and delete functionality
 * Handles loading and error states
 */

import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import type { Post } from '../types';
import './PostList.css';

interface PostListProps {
  onEdit?: (post: Post) => void;
}

export function PostList({ onEdit }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await postsAPI.list();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await postsAPI.delete(uuid);
      setPosts(posts.filter(post => post.id !== uuid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="post-list-container">
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-list-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={loadPosts}>Retry</button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="post-list-container">
        <div className="empty-state">
          <p>No posts yet. Create your first post!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-list-container">
      <h2>Posts</h2>
      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <header className="post-header">
              <h3>{post.title}</h3>
              <div className="post-actions">
                {onEdit && (
                  <button
                    onClick={() => onEdit(post)}
                    className="btn-edit"
                    aria-label={`Edit ${post.title}`}
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(post.id)}
                  className="btn-delete"
                  aria-label={`Delete ${post.title}`}
                >
                  Delete
                </button>
              </div>
            </header>
            
            <div className="post-content">
              <p>{post.content}</p>
            </div>
            
            {post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <footer className="post-footer">
              <div className="post-dates">
                <span className="date-created">
                  Created: {formatDate(post.date_created)}
                </span>
                {post.date_updated !== post.date_created && (
                  <span className="date-updated">
                    Updated: {formatDate(post.date_updated)}
                  </span>
                )}
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
