/**
 * Circular Layout Algorithm
 * 
 * Arranges nodes in a circle or concentric circles
 * Groups nodes by type and distributes them evenly
 * 
 * **Validates: Requirements 1.10, 1.12, 1.13**
 */

import type { Mind } from '../../../types/generated';
import type { Relationship } from '../GraphEditorContext';
import type { NodePosition } from './types';

/**
 * Circular layout - arranges nodes in concentric circles
 * 
 * @param nodes - Array of Mind nodes to position
 * @param edges - Array of Relationship edges (not used in circular layout)
 * @param distance - Distance multiplier (affects radius)
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Array of node positions
 */
export function circularLayout(
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

  // Center point
  const centerX = width / 2;
  const centerY = height / 2;

  // Group nodes by type
  const nodesByType = new Map<string, Mind[]>();
  nodes.forEach(node => {
    const type = node.__primarylabel__;
    if (!nodesByType.has(type)) {
      nodesByType.set(type, []);
    }
    nodesByType.get(type)!.push(node);
  });

  const typeGroups = Array.from(nodesByType.values());
  const positions: NodePosition[] = [];

  // If only one type or few nodes, use single circle
  if (typeGroups.length === 1 || nodes.length <= 10) {
    const radius = Math.min(width, height) * 0.35 * distance;
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      positions.push({
        id: node.uuid!,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  } else {
    // Multiple concentric circles for different types
    const maxRadius = Math.min(width, height) * 0.4 * distance;
    const radiusStep = maxRadius / typeGroups.length;

    typeGroups.forEach((group, groupIndex) => {
      const radius = (groupIndex + 1) * radiusStep;
      const angleStep = (2 * Math.PI) / group.length;

      group.forEach((node, nodeIndex) => {
        const angle = nodeIndex * angleStep - Math.PI / 2; // Start from top
        positions.push({
          id: node.uuid!,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
    });
  }

  return positions;
}
