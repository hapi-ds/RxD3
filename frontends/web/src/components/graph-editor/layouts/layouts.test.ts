/**
 * Layout Algorithms Unit Tests
 * 
 * Tests basic functionality of all layout algorithms
 * 
 * **Validates: Requirements 1.10, 1.12, 1.13**
 */

import { describe, it, expect } from 'vitest';
import { forceDirectedLayout } from './forceDirectedLayout';
import { hierarchicalLayout } from './hierarchicalLayout';
import { circularLayout } from './circularLayout';
import { gridLayout } from './gridLayout';
import { getLayoutFunction, getAvailableLayouts, LAYOUT_ALGORITHMS } from './index';
import type { Mind } from '../../../types/generated';
import type { Relationship } from '../GraphEditorContext';

// Test data
const createTestNodes = (count: number): Mind[] => {
  return Array.from({ length: count }, (_, i) => ({
    __primarylabel__: 'Task' as const,
    uuid: `node-${i}`,
    title: `Node ${i}`,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator: 'test',
    status: 'active' as const,
    description: null,
    tags: null,
    priority: 'medium' as const,
    due_date: null,
    effort: null,
    duration: null,
    length: null,
    task_type: 'TASK' as const,
    phase_number: null,
    target_date: null,
    completion_percentage: null,
  }));
};

const createTestEdges = (nodeCount: number): Relationship[] => {
  const edges: Relationship[] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      type: 'RELATES_TO',
      source: `node-${i}`,
      target: `node-${i + 1}`,
    });
  }
  return edges;
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

describe('Layout Algorithms', () => {
  describe('forceDirectedLayout', () => {
    it('should return empty array for empty input', () => {
      const result = forceDirectedLayout([], [], 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      expect(result).toEqual([]);
    });

    it('should position all nodes', () => {
      const nodes = createTestNodes(5);
      const edges = createTestEdges(5);
      const result = forceDirectedLayout(nodes, edges, 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      expect(result).toHaveLength(5);
      result.forEach(pos => {
        expect(pos).toHaveProperty('id');
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });

    it('should respect distance parameter', () => {
      const nodes = createTestNodes(3);
      const edges = createTestEdges(3);
      
      const result1 = forceDirectedLayout(nodes, edges, 0.5, CANVAS_WIDTH, CANVAS_HEIGHT);
      const result2 = forceDirectedLayout(nodes, edges, 2.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Calculate average distance between nodes
      const avgDist1 = calculateAverageDistance(result1);
      const avgDist2 = calculateAverageDistance(result2);
      
      // Higher distance parameter should result in larger spacing
      expect(avgDist2).toBeGreaterThan(avgDist1);
    });
  });

  describe('hierarchicalLayout', () => {
    it('should return empty array for empty input', () => {
      const result = hierarchicalLayout([], [], 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      expect(result).toEqual([]);
    });

    it('should position all nodes', () => {
      const nodes = createTestNodes(5);
      const edges = createTestEdges(5);
      const result = hierarchicalLayout(nodes, edges, 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      expect(result).toHaveLength(5);
      result.forEach(pos => {
        expect(pos).toHaveProperty('id');
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });

    it('should respect distance parameter', () => {
      const nodes = createTestNodes(4);
      const edges = createTestEdges(4);
      
      const result1 = hierarchicalLayout(nodes, edges, 0.5, CANVAS_WIDTH, CANVAS_HEIGHT);
      const result2 = hierarchicalLayout(nodes, edges, 2.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Calculate vertical spread
      const spread1 = calculateVerticalSpread(result1);
      const spread2 = calculateVerticalSpread(result2);
      
      // Higher distance parameter should result in larger vertical spacing
      expect(spread2).toBeGreaterThan(spread1);
    });
  });

  describe('circularLayout', () => {
    it('should return empty array for empty input', () => {
      const result = circularLayout([], [], 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      expect(result).toEqual([]);
    });

    it('should position all nodes', () => {
      const nodes = createTestNodes(8);
      const edges = createTestEdges(8);
      const result = circularLayout(nodes, edges, 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      expect(result).toHaveLength(8);
      result.forEach(pos => {
        expect(pos).toHaveProperty('id');
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });

    it('should respect distance parameter', () => {
      const nodes = createTestNodes(6);
      const edges = createTestEdges(6);
      
      const result1 = circularLayout(nodes, edges, 0.5, CANVAS_WIDTH, CANVAS_HEIGHT);
      const result2 = circularLayout(nodes, edges, 2.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Calculate radius from center
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      
      const radius1 = Math.sqrt(
        Math.pow(result1[0].x - centerX, 2) + Math.pow(result1[0].y - centerY, 2)
      );
      const radius2 = Math.sqrt(
        Math.pow(result2[0].x - centerX, 2) + Math.pow(result2[0].y - centerY, 2)
      );
      
      // Higher distance parameter should result in larger radius
      expect(radius2).toBeGreaterThan(radius1);
    });
  });

  describe('gridLayout', () => {
    it('should return empty array for empty input', () => {
      const result = gridLayout([], [], 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      expect(result).toEqual([]);
    });

    it('should position all nodes', () => {
      const nodes = createTestNodes(9);
      const edges = createTestEdges(9);
      const result = gridLayout(nodes, edges, 1.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      expect(result).toHaveLength(9);
      result.forEach(pos => {
        expect(pos).toHaveProperty('id');
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });

    it('should respect distance parameter', () => {
      const nodes = createTestNodes(4);
      const edges = createTestEdges(4);
      
      const result1 = gridLayout(nodes, edges, 0.5, CANVAS_WIDTH, CANVAS_HEIGHT);
      const result2 = gridLayout(nodes, edges, 2.0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Calculate cell spacing
      const spacing1 = Math.abs(result1[1].x - result1[0].x);
      const spacing2 = Math.abs(result2[1].x - result2[0].x);
      
      // Higher distance parameter should result in larger cell spacing
      expect(spacing2).toBeGreaterThan(spacing1);
    });
  });

  describe('Layout Registry', () => {
    it('should have all four layout algorithms available', () => {
      const layouts = getAvailableLayouts();
      expect(layouts).toHaveLength(4);
      expect(layouts).toContain('force-directed');
      expect(layouts).toContain('hierarchical');
      expect(layouts).toContain('circular');
      expect(layouts).toContain('grid');
    });

    it('should return correct layout function', () => {
      expect(getLayoutFunction('force-directed')).toBe(forceDirectedLayout);
      expect(getLayoutFunction('hierarchical')).toBe(hierarchicalLayout);
      expect(getLayoutFunction('circular')).toBe(circularLayout);
      expect(getLayoutFunction('grid')).toBe(gridLayout);
    });

    it('should have all algorithms in LAYOUT_ALGORITHMS map', () => {
      expect(LAYOUT_ALGORITHMS['force-directed']).toBe(forceDirectedLayout);
      expect(LAYOUT_ALGORITHMS['hierarchical']).toBe(hierarchicalLayout);
      expect(LAYOUT_ALGORITHMS['circular']).toBe(circularLayout);
      expect(LAYOUT_ALGORITHMS['grid']).toBe(gridLayout);
    });
  });
});

// Helper functions
function calculateAverageDistance(positions: Array<{ x: number; y: number }>): number {
  if (positions.length < 2) return 0;
  
  let totalDistance = 0;
  let count = 0;
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      count++;
    }
  }
  
  return totalDistance / count;
}

function calculateVerticalSpread(positions: Array<{ y: number }>): number {
  if (positions.length === 0) return 0;
  
  const yValues = positions.map(p => p.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  return maxY - minY;
}
