/**
 * API service layer for the FastAPI Neo4j Multi-Frontend System
 * Handles all HTTP requests to the backend with JWT authentication
 */

import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import type { LoginCredentials, Token, PostCreate, PostUpdate, Post } from '../types';

/**
 * Create axios instance with base configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to include JWT token from localStorage
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle 403 errors (invalid/expired tokens)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Token is invalid or expired, clear it and redirect to login
      localStorage.removeItem('token');
      // Optionally trigger a redirect to login page
      // This can be handled by the component or a global error handler
      console.warn('Authentication failed. Token cleared.');
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API methods
 */
export const authAPI = {
  /**
   * Login with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with JWT token
   */
  login: async (email: string, password: string): Promise<Token> => {
    const credentials: LoginCredentials = {
      username: email, // Backend expects 'username' field
      password,
    };
    const response = await api.post<Token>('/users/login', credentials);
    return response.data;
  },

  /**
   * Register a new user
   * @param email - User's email address
   * @param password - User's password
   * @param fullname - User's full name
   * @returns Promise with the created user data
   */
  register: async (email: string, password: string, fullname: string): Promise<void> => {
    await api.post('/users', { email, password, fullname });
  },
};

/**
 * Posts API methods
 */
export const postsAPI = {
  /**
   * Get all posts
   * @returns Promise with array of posts
   */
  list: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts');
    return response.data;
  },

  /**
   * Create a new post
   * @param data - Post creation data
   * @returns Promise with the created post
   */
  create: async (data: PostCreate): Promise<Post> => {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  },

  /**
   * Update an existing post
   * @param uuid - Post ID
   * @param data - Post update data
   * @returns Promise with the updated post
   */
  update: async (uuid: string, data: PostUpdate): Promise<Post> => {
    const response = await api.put<Post>(`/posts/${uuid}`, data);
    return response.data;
  },

  /**
   * Delete a post
   * @param uuid - Post ID
   * @returns Promise that resolves when deletion is complete
   */
  delete: async (uuid: string): Promise<void> => {
    await api.delete(`/posts/${uuid}`);
  },
};

/**
 * Export the configured axios instance for custom requests
 */
export default api;
