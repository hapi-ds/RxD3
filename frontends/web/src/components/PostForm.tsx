/**
 * PostForm Component
 * Form for creating and editing posts
 * Supports both create mode (POST /posts) and edit mode (PUT /posts/{uuid})
 * Validates inputs before submission and displays success/error messages
 */

import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import type { Post, PostCreate, PostUpdate } from '../types';
import './PostForm.css';

interface PostFormProps {
  post?: Post | null;
  onSuccess?: (post: Post) => void;
  onCancel?: () => void;
}

export function PostForm({ post, onSuccess, onCancel }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!post;

  // Populate form when editing
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setTags(post.tags.join(', '));
    }
  }, [post]);

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Title is required';
    }
    if (title.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }
    if (!content.trim()) {
      return 'Content is required';
    }
    if (content.trim().length < 10) {
      return 'Content must be at least 10 characters';
    }
    return null;
  };

  const parseTags = (tagsString: string): string[] => {
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate inputs
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const postData: PostCreate | PostUpdate = {
        title: title.trim(),
        content: content.trim(),
        tags: parseTags(tags),
      };

      let result: Post;
      if (isEditMode && post) {
        // Edit mode: PUT /posts/{uuid}
        result = await postsAPI.update(post.id, postData);
        setSuccess('Post updated successfully!');
      } else {
        // Create mode: POST /posts
        result = await postsAPI.create(postData);
        setSuccess('Post created successfully!');
        // Clear form after successful creation
        setTitle('');
        setContent('');
        setTags('');
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save post';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <div className="post-form-container">
      <h2>{isEditMode ? 'Edit Post' : 'Create New Post'}</h2>
      
      {error && (
        <div className="message error-message" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="message success-message" role="status">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            disabled={loading}
            aria-required="true"
            maxLength={200}
          />
          <span className="field-hint">Minimum 3 characters</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">
            Content <span className="required">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter post content"
            disabled={loading}
            aria-required="true"
            rows={8}
          />
          <span className="field-hint">Minimum 10 characters</span>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas"
            disabled={loading}
          />
          <span className="field-hint">Separate multiple tags with commas (e.g., tech, tutorial, react)</span>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Post' : 'Create Post'}
          </button>
          
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
