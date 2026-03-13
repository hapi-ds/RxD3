/**
 * Selection Handling Tests
 * Tests for node and edge selection functionality
 * 
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GraphEditorProvider, useGraphEditor } from './GraphEditorContext';
import type { Mind, Relationship } from './GraphEditorContext';

describe('Selection Handling', () => {
  const createMockMind = (uuid: string, title: string): Mind => ({
    uuid,
    title,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator: 'test-user',
    status: 'active',
    description: null,
    tags: null,
    __primarylabel__: 'Task',
  });

  const createMockRelationship = (id: string, source: string, target: string): Relationship => ({
    id,
    type: 'DEPENDS_ON',
    source,
    target,
    properties: {},
  });

  it('should handle node selection via SELECT_NODE action', () => {
    const mind1 = createMockMind('uuid-1', 'Task 1');
    const mind2 = createMockMind('uuid-2', 'Task 2');

    const { result } = renderHook(() => useGraphEditor(), {
      wrapper: ({ children }) => (
        <GraphEditorProvider
          initialMinds={[mind1, mind2]}
          initialRelationships={[]}
        >
          {children}
        </GraphEditorProvider>
      ),
    });

    // Initially no node should be selected
    expect(result.current.state.selection.selectedNodeId).toBeNull();

    // Select node 1
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: 'uuid-1' });
    });

    expect(result.current.state.selection.selectedNodeId).toBe('uuid-1');
  });

  it('should handle edge selection via SELECT_EDGE action', () => {
    const mind1 = createMockMind('uuid-1', 'Task 1');
    const mind2 = createMockMind('uuid-2', 'Task 2');
    const rel1 = createMockRelationship('rel-1', 'uuid-1', 'uuid-2');

    const { result } = renderHook(() => useGraphEditor(), {
      wrapper: ({ children }) => (
        <GraphEditorProvider
          initialMinds={[mind1, mind2]}
          initialRelationships={[rel1]}
        >
          {children}
        </GraphEditorProvider>
      ),
    });

    // Initially no edge should be selected
    expect(result.current.state.selection.selectedEdgeId).toBeNull();

    // Select edge
    act(() => {
      result.current.dispatch({ type: 'SELECT_EDGE', payload: 'rel-1' });
    });

    expect(result.current.state.selection.selectedEdgeId).toBe('rel-1');
  });

  it('should deselect node when SELECT_NODE is called with null', () => {
    const mind1 = createMockMind('uuid-1', 'Task 1');

    const { result } = renderHook(() => useGraphEditor(), {
      wrapper: ({ children }) => (
        <GraphEditorProvider
          initialMinds={[mind1]}
          initialRelationships={[]}
        >
          {children}
        </GraphEditorProvider>
      ),
    });

    // Select a node
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: 'uuid-1' });
    });

    expect(result.current.state.selection.selectedNodeId).toBe('uuid-1');

    // Deselect
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: null });
    });

    expect(result.current.state.selection.selectedNodeId).toBeNull();
  });

  it('should switch selection when selecting different nodes', () => {
    const mind1 = createMockMind('uuid-1', 'Task 1');
    const mind2 = createMockMind('uuid-2', 'Task 2');

    const { result } = renderHook(() => useGraphEditor(), {
      wrapper: ({ children }) => (
        <GraphEditorProvider
          initialMinds={[mind1, mind2]}
          initialRelationships={[]}
        >
          {children}
        </GraphEditorProvider>
      ),
    });

    // Select node 1
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: 'uuid-1' });
    });

    expect(result.current.state.selection.selectedNodeId).toBe('uuid-1');

    // Select node 2
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: 'uuid-2' });
    });

    expect(result.current.state.selection.selectedNodeId).toBe('uuid-2');
  });

  it('should clear edge selection when selecting a node', () => {
    const mind1 = createMockMind('uuid-1', 'Task 1');
    const mind2 = createMockMind('uuid-2', 'Task 2');
    const rel1 = createMockRelationship('rel-1', 'uuid-1', 'uuid-2');

    const { result } = renderHook(() => useGraphEditor(), {
      wrapper: ({ children }) => (
        <GraphEditorProvider
          initialMinds={[mind1, mind2]}
          initialRelationships={[rel1]}
        >
          {children}
        </GraphEditorProvider>
      ),
    });

    // Select edge first
    act(() => {
      result.current.dispatch({ type: 'SELECT_EDGE', payload: 'rel-1' });
    });

    expect(result.current.state.selection.selectedEdgeId).toBe('rel-1');

    // Select node - should clear edge selection
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: 'uuid-1' });
    });

    expect(result.current.state.selection.selectedNodeId).toBe('uuid-1');
    expect(result.current.state.selection.selectedEdgeId).toBeNull();
  });

  it('should clear node selection when selecting an edge', () => {
    const mind1 = createMockMind('uuid-1', 'Task 1');
    const mind2 = createMockMind('uuid-2', 'Task 2');
    const rel1 = createMockRelationship('rel-1', 'uuid-1', 'uuid-2');

    const { result } = renderHook(() => useGraphEditor(), {
      wrapper: ({ children }) => (
        <GraphEditorProvider
          initialMinds={[mind1, mind2]}
          initialRelationships={[rel1]}
        >
          {children}
        </GraphEditorProvider>
      ),
    });

    // Select node first
    act(() => {
      result.current.dispatch({ type: 'SELECT_NODE', payload: 'uuid-1' });
    });

    expect(result.current.state.selection.selectedNodeId).toBe('uuid-1');

    // Select edge - should clear node selection
    act(() => {
      result.current.dispatch({ type: 'SELECT_EDGE', payload: 'rel-1' });
    });

    expect(result.current.state.selection.selectedEdgeId).toBe('rel-1');
    expect(result.current.state.selection.selectedNodeId).toBeNull();
  });
});
