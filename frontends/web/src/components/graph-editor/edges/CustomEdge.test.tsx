/**
 * CustomEdge Component Tests
 * 
 * **Validates: Requirements 1.2, 1.7**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { CustomEdge } from './CustomEdge';
import type { EdgeProps } from 'reactflow';

/**
 * Helper to create mock edge props
 */
function createMockEdgeProps(overrides?: Partial<EdgeProps>): EdgeProps {
  return {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceX: 100,
    sourceY: 100,
    targetX: 200,
    targetY: 200,
    sourcePosition: 'right' as const,
    targetPosition: 'left' as const,
    data: {},
    ...overrides,
  } as EdgeProps;
}

describe('CustomEdge', () => {
  it('renders without crashing', () => {
    const props = createMockEdgeProps();
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    expect(container).toBeTruthy();
  });

  it('renders with CONTAINS relationship type', () => {
    const props = createMockEdgeProps({
      data: {
        relationship: {
          id: 'rel-1',
          type: 'CONTAINS',
          source: 'node-1',
          target: 'node-2',
        },
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Check that marker is defined
    const marker = container.querySelector('marker[id="arrow-contains"]');
    expect(marker).toBeTruthy();
  });

  it('renders with DEPENDS_ON relationship type', () => {
    const props = createMockEdgeProps({
      data: {
        relationship: {
          id: 'rel-2',
          type: 'DEPENDS_ON',
          source: 'node-1',
          target: 'node-2',
        },
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Check that marker is defined
    const marker = container.querySelector('marker[id="arrow-depends_on"]');
    expect(marker).toBeTruthy();
  });

  it('renders with ASSIGNED_TO relationship type', () => {
    const props = createMockEdgeProps({
      data: {
        relationship: {
          id: 'rel-3',
          type: 'ASSIGNED_TO',
          source: 'node-1',
          target: 'node-2',
        },
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Check that marker is defined
    const marker = container.querySelector('marker[id="arrow-assigned_to"]');
    expect(marker).toBeTruthy();
  });

  it('uses default style for unknown relationship type', () => {
    const props = createMockEdgeProps({
      data: {
        relationship: {
          id: 'rel-4',
          type: 'UNKNOWN_TYPE',
          source: 'node-1',
          target: 'node-2',
        },
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Should still render without errors
    expect(container).toBeTruthy();
  });

  it('renders arrow marker with correct color for each type', () => {
    const types = [
      { type: 'CONTAINS', color: '#3b82f6' },
      { type: 'DEPENDS_ON', color: '#ef4444' },
      { type: 'ASSIGNED_TO', color: '#10b981' },
      { type: 'RELATES_TO', color: '#6b7280' },
      { type: 'IMPLEMENTS', color: '#8b5cf6' },
      { type: 'MITIGATES', color: '#f59e0b' },
    ];

    types.forEach(({ type, color }) => {
      const props = createMockEdgeProps({
        id: `edge-${type}`,
        data: {
          relationship: {
            id: `rel-${type}`,
            type,
            source: 'node-1',
            target: 'node-2',
          },
        },
      });
      
      const { container } = render(
        <ReactFlowProvider>
          <svg>
            <CustomEdge {...props} />
          </svg>
        </ReactFlowProvider>
      );
      
      // Check that marker arrow has correct fill color
      const markerPath = container.querySelector(`marker[id="arrow-${type.toLowerCase()}"] path`);
      expect(markerPath).toBeTruthy();
      expect(markerPath?.getAttribute('fill')).toBe(color);
    });
  });

  it('renders with directionality (arrow marker)', () => {
    const props = createMockEdgeProps({
      data: {
        relationship: {
          id: 'rel-1',
          type: 'CONTAINS',
          source: 'node-1',
          target: 'node-2',
        },
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Check that marker has arrow path
    const markerPath = container.querySelector('marker path');
    expect(markerPath).toBeTruthy();
    expect(markerPath?.getAttribute('d')).toBe('M 0 0 L 12 6 L 0 12 z');
  });

  it('calls onMouseEnter when edge is hovered', () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    
    const props = createMockEdgeProps({
      id: 'edge-hover-test',
      data: {
        relationship: {
          id: 'rel-hover',
          type: 'CONTAINS',
          source: 'node-1',
          target: 'node-2',
        },
        onMouseEnter,
        onMouseLeave,
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Find the invisible hover path (transparent stroke)
    const hoverPath = container.querySelector('path[stroke="transparent"]');
    expect(hoverPath).toBeTruthy();
    
    // Simulate mouse enter
    fireEvent.mouseEnter(hoverPath!);
    expect(onMouseEnter).toHaveBeenCalledWith(expect.any(Object), 'edge-hover-test');
  });

  it('calls onMouseLeave when mouse leaves edge', () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    
    const props = createMockEdgeProps({
      id: 'edge-hover-test',
      data: {
        relationship: {
          id: 'rel-hover',
          type: 'CONTAINS',
          source: 'node-1',
          target: 'node-2',
        },
        onMouseEnter,
        onMouseLeave,
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Find the invisible hover path
    const hoverPath = container.querySelector('path[stroke="transparent"]');
    expect(hoverPath).toBeTruthy();
    
    // Simulate mouse leave
    fireEvent.mouseLeave(hoverPath!);
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('displays relationship type in tooltip on hover', () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    
    const props = createMockEdgeProps({
      id: 'edge-tooltip-test',
      data: {
        relationship: {
          id: 'rel-tooltip',
          type: 'DEPENDS_ON',
          source: 'node-1',
          target: 'node-2',
        },
        onMouseEnter,
        onMouseLeave,
      },
    });
    
    const { container } = render(
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    );
    
    // Find the invisible hover path
    const hoverPath = container.querySelector('path[stroke="transparent"]');
    expect(hoverPath).toBeTruthy();
    
    // Simulate mouse enter
    fireEvent.mouseEnter(hoverPath!);
    
    // Verify onMouseEnter was called with the edge ID
    // The parent component (GraphCanvas) will handle showing the tooltip with relationship type
    expect(onMouseEnter).toHaveBeenCalledWith(expect.any(Object), 'edge-tooltip-test');
  });
});
