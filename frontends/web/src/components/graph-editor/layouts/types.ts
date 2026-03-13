/**
 * Layout types and interfaces
 * 
 * Defines the common interface for all layout algorithms
 * 
 * **Validates: Requirements 1.10, 1.12**
 */

import type { Mind } from '../../../types/generated';
import type { Relationship } from '../GraphEditorContext';

/**
 * Position of a node in 2D space
 */
export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Layout algorithm function signature
 * 
 * @param nodes - Array of Mind nodes to position
 * @param edges - Array of Relationship edges connecting nodes
 * @param distance - Distance multiplier controlling node spacing (0.5-2.0)
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Array of node positions
 */
export type LayoutFunction = (
  nodes: Mind[],
  edges: Relationship[],
  distance: number,
  width: number,
  height: number
) => NodePosition[];

/**
 * Layout algorithm identifier
 */
export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'circular' | 'grid';
