/**
 * Force-Directed Layout Algorithm
 * 
 * Uses D3-force simulation to position nodes based on physical forces:
 * - Link force: Attracts connected nodes
 * - Charge force: Repels all nodes from each other
 * - Center force: Pulls nodes toward the center
 * 
 * **Validates: Requirements 1.10, 1.12, 1.13**
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Mind } from '../../../types/generated';
import type { Relationship } from '../GraphEditorContext';
import type { NodePosition } from './types';

/**
 * Node type for D3 simulation
 */
interface SimNode extends SimulationNodeDatum {
  id: string;
}

/**
 * Link type for D3 simulation
 */
interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string;
  target: string;
}

/**
 * Force-directed layout using D3-force simulation
 * 
 * @param nodes - Array of Mind nodes to position
 * @param edges - Array of Relationship edges connecting nodes
 * @param distance - Distance multiplier (affects link distance and charge strength)
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Array of node positions
 */
export function forceDirectedLayout(
  nodes: Mind[],
  edges: Relationship[],
  distance: number,
  width: number,
  height: number
): NodePosition[] {
  // Handle empty graph
  if (nodes.length === 0) {
    return [];
  }

  // Create simulation nodes
  const simNodes: SimNode[] = nodes.map(node => ({
    id: node.uuid!,
  }));

  // Create simulation links
  const simLinks: SimLink[] = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
  }));

  // Configure forces based on distance parameter
  const linkDistance = distance * 100; // Base distance of 100px
  const chargeStrength = -distance * 300; // Repulsion strength
  const centerStrength = 0.1; // Gentle centering

  // Create and configure simulation
  const simulation = forceSimulation(simNodes)
    .force('link', forceLink<SimNode, SimLink>(simLinks)
      .id(d => d.id)
      .distance(linkDistance)
      .strength(0.5))
    .force('charge', forceManyBody<SimNode>()
      .strength(chargeStrength))
    .force('center', forceCenter<SimNode>(width / 2, height / 2)
      .strength(centerStrength))
    .stop();

  // Run simulation to completion (300 iterations)
  const iterations = 300;
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Extract positions
  return simNodes.map(node => ({
    id: node.id,
    x: node.x ?? width / 2,
    y: node.y ?? height / 2,
  }));
}
