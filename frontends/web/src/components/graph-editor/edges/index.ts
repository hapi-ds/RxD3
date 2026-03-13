/**
 * Edge types configuration for react-flow
 * Exports custom edge components and edge types mapping
 * 
 * **Validates: Requirements 1.2**
 */

import type { EdgeTypes } from 'reactflow';
import { CustomEdge } from './CustomEdge';

/**
 * Edge types mapping for react-flow
 * Maps edge type names to their corresponding components
 */
export const edgeTypes: EdgeTypes = {
  default: CustomEdge,
  custom: CustomEdge,
};

export { CustomEdge } from './CustomEdge';
export type { RelationshipType } from './CustomEdge';
