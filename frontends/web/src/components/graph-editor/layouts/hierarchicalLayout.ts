/**
 * Hierarchical Layout Algorithm
 * 
 * Uses Dagre library to create a layered graph layout (Sugiyama framework)
 * Nodes are arranged in horizontal layers with edges flowing top-to-bottom
 * 
 * **Validates: Requirements 1.10, 1.12, 1.13**
 */

import * as dagre from 'dagre';
import type { Mind } from '../../../types/generated';
import type { Relationship } from '../GraphEditorContext';
import type { NodePosition } from './types';

/**
 * Default node dimensions for layout calculation
 */
const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

/**
 * Hierarchical layout using Dagre
 * 
 * @param nodes - Array of Mind nodes to position
 * @param edges - Array of Relationship edges connecting nodes
 * @param distance - Distance multiplier (affects vertical spacing between layers)
 * @param width - Canvas width in pixels (used for centering)
 * @param height - Canvas height in pixels (used for centering)
 * @returns Array of node positions
 */
export function hierarchicalLayout(
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

  // Create a new directed graph
  const graph = new dagre.graphlib.Graph();

  // Configure graph settings
  const rankSep = distance * 100; // Vertical spacing between layers
  const nodeSep = distance * 50; // Horizontal spacing between nodes
  
  graph.setGraph({
    rankdir: 'TB', // Top-to-bottom direction
    ranksep: rankSep,
    nodesep: nodeSep,
    edgesep: 10,
    marginx: 20,
    marginy: 20,
  });

  // Set default edge label
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  nodes.forEach(node => {
    graph.setNode(node.uuid!, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Add edges to graph
  edges.forEach(edge => {
    // Only add edge if both nodes exist
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  // Run layout algorithm
  dagre.layout(graph);

  // Get graph dimensions for centering
  const graphInfo = graph.graph();
  const graphWidth = (graphInfo.width ?? 0);
  const graphHeight = (graphInfo.height ?? 0);

  // Calculate offset to center the graph
  const offsetX = (width - graphWidth) / 2;
  const offsetY = (height - graphHeight) / 2;

  // Extract positions
  return nodes.map(node => {
    const nodeInfo = graph.node(node.uuid!);
    return {
      id: node.uuid!,
      x: (nodeInfo?.x ?? 0) + offsetX,
      y: (nodeInfo?.y ?? 0) + offsetY,
    };
  });
}
