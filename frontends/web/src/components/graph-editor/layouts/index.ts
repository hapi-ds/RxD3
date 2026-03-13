/**
 * Layout Algorithms Index
 * 
 * Exports all layout algorithms and utilities
 * 
 * **Validates: Requirements 1.10, 1.12, 1.13**
 */

export { forceDirectedLayout } from './forceDirectedLayout';
export { hierarchicalLayout } from './hierarchicalLayout';
export { circularLayout } from './circularLayout';
export { gridLayout } from './gridLayout';
export type { NodePosition, LayoutFunction, LayoutAlgorithm } from './types';

import type { LayoutFunction, LayoutAlgorithm } from './types';
import { forceDirectedLayout } from './forceDirectedLayout';
import { hierarchicalLayout } from './hierarchicalLayout';
import { circularLayout } from './circularLayout';
import { gridLayout } from './gridLayout';

/**
 * Map of layout algorithm names to their implementation functions
 */
export const LAYOUT_ALGORITHMS: Record<LayoutAlgorithm, LayoutFunction> = {
  'force-directed': forceDirectedLayout,
  'hierarchical': hierarchicalLayout,
  'circular': circularLayout,
  'grid': gridLayout,
};

/**
 * Get layout function by algorithm name
 * 
 * @param algorithm - Layout algorithm identifier
 * @returns Layout function implementation
 */
export function getLayoutFunction(algorithm: LayoutAlgorithm): LayoutFunction {
  return LAYOUT_ALGORITHMS[algorithm];
}

/**
 * Get all available layout algorithm names
 * 
 * @returns Array of layout algorithm identifiers
 */
export function getAvailableLayouts(): LayoutAlgorithm[] {
  return Object.keys(LAYOUT_ALGORITHMS) as LayoutAlgorithm[];
}
