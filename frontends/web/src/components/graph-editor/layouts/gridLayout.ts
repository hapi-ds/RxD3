/**
 * Grid Layout Algorithm
 * 
 * Arranges nodes in a regular grid pattern
 * Nodes are sorted by type and title, then placed in row-major order
 * 
 * **Validates: Requirements 1.10, 1.12, 1.13**
 */

import type { Mind } from '../../../types/generated';
import type { Relationship } from '../GraphEditorContext';
import type { NodePosition } from './types';

/**
 * Grid layout - arranges nodes in a regular grid
 * 
 * @param nodes - Array of Mind nodes to position
 * @param edges - Array of Relationship edges (not used in grid layout)
 * @param distance - Distance multiplier (affects cell size)
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Array of node positions
 */
export function gridLayout(
  nodes: Mind[],
  _edges: Relationship[],
  distance: number,
  width: number,
  height: number
): NodePosition[] {
  // Handle empty graph
  if (nodes.length === 0) {
    return [];
  }

  // Sort nodes by type, then by title for consistent ordering
  const sortedNodes = [...nodes].sort((a, b) => {
    const typeCompare = a.__primarylabel__.localeCompare(b.__primarylabel__);
    if (typeCompare !== 0) return typeCompare;
    return a.title.localeCompare(b.title);
  });

  // Calculate grid dimensions
  const nodeCount = sortedNodes.length;
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const rows = Math.ceil(nodeCount / cols);

  // Calculate cell size based on distance parameter
  const baseCellSize = 200;
  const cellWidth = baseCellSize * distance;
  const cellHeight = baseCellSize * distance;

  // Calculate total grid size
  const gridWidth = cols * cellWidth;
  const gridHeight = rows * cellHeight;

  // Calculate offset to center the grid
  const offsetX = (width - gridWidth) / 2 + cellWidth / 2;
  const offsetY = (height - gridHeight) / 2 + cellHeight / 2;

  // Position nodes in grid
  const positions: NodePosition[] = sortedNodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      id: node.uuid!,
      x: offsetX + col * cellWidth,
      y: offsetY + row * cellHeight,
    };
  });

  return positions;
}
