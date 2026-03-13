/**
 * TypeScript type definitions for the FastAPI Neo4j Multi-Frontend System
 * These types match the backend Pydantic models and API contracts
 */

/**
 * User entity representing a registered user in the system
 */
export interface User {
  id: string;
  email: string;
  fullname: string;
}

/**
 * Post entity representing a user-created post
 */
export interface Post {
  id: string;
  title: string;
  content: string;
  date_created: string;
  date_updated: string;
  tags: string[];
}

/**
 * Request payload for creating a new post
 */
export interface PostCreate {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Request payload for updating an existing post
 */
export interface PostUpdate {
  title: string;
  content: string;
  tags: string[];
}

/**
 * JWT authentication token response from login endpoint
 */
export interface Token {
  access_token: string;
  type: string;
}

/**
 * Login credentials for authentication
 */
export interface LoginCredentials {
  username: string; // email
  password: string;
}

/**
 * WebSocket message types for real-time communication
 */
export interface WSMessage {
  type: 'message' | 'user_event';
  content?: string;
  sender?: string;
  event?: 'joined' | 'left';
  email?: string;
  timestamp: string;
}

/**
 * Relationship types for Mind Graph connections
 */
export type RelationshipType = 
  | 'PREVIOUS'
  | 'SCHEDULED'
  | 'CONTAINS'
  | 'PREDATES'
  | 'ASSIGNED_TO'
  | 'TO'
  | 'FOR'
  | 'REFINES';

/**
 * Relationship entity representing connections between Mind nodes
 */
export interface Relationship {
  id: string;
  type: RelationshipType;
  source: string; // UUID of source Mind
  target: string; // UUID of target Mind
  properties: Record<string, any>;
}
