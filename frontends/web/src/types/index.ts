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


/** Skill summary for list views (excludes content) */
export interface Skill {
  uuid: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/** Full skill detail including content */
export interface SkillDetail extends Skill {
  content: string;
}

/** Payload for creating a new skill */
export interface SkillCreate {
  name: string;
  description: string;
  content: string;
}

/** Payload for updating an existing skill */
export interface SkillUpdate {
  name: string;
  description: string;
  content: string;
}

/** Mind node as serialized in save file */
export interface MindExport {
  uuid: string;
  mind_type: string;
  title: string;
  version: number;
  created_at: string;
  updated_at: string;
  creator: string;
  status: string;
  description: string | null;
  tags: string[] | null;
  type_specific_attributes: Record<string, unknown>;
}

/** Relationship as serialized in save file */
export interface RelationshipExport {
  source_uuid: string;
  target_uuid: string;
  relationship_type: string;
  properties: Record<string, unknown>;
}

/** Post node as serialized in save file */
export interface PostExport {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date_created: string;
  date_updated: string;
}

/** Structure of the save file JSON */
export interface SaveFileData {
  minds: MindExport[];
  relationships: RelationshipExport[];
  posts: PostExport[];
}

/** Response from the read endpoint */
export interface ReadResponse {
  minds_count: number;
  relationships_count: number;
  posts_count: number;
}

/** Response from the clear endpoint */
export interface ClearResponse {
  minds_deleted: number;
  relationships_deleted: number;
  posts_deleted: number;
}
