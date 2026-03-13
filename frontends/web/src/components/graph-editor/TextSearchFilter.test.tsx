/**
 * Comprehensive tests for text search filter logic
 * Tests requirements 2.8, 2.11, 2.12
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  GraphEditorProvider,
  useGraphEditor,
  type Mind,
  type Relationship,
} from './GraphEditorContext';

// Test wrapper component
function wrapper({ children }: { children: ReactNode }) {
  return <GraphEditorProvider>{children}</GraphEditorProvider>;
}

describe('Text Search Filter Logic (Task 19.3)', () => {
  describe('Requirement 2.8: Find nodes matching search text in title', () => {
    it('should find nodes with exact title match', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication System',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Database Setup',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).not.toContain('uuid-2');
    });

    it('should find nodes with partial title match', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication System',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Database Setup',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Auth' });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).not.toContain('uuid-2');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication System',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'authentication' });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');

      act(() => {
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'AUTHENTICATION' });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
    });

    it('should find multiple matching nodes', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'User Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Authentication Tests',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-3',
          title: 'Database Setup',
          version: 1,
          creator: 'user1',
          priority: 'medium',
          assignee: 'user1',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).toContain('uuid-2');
      expect(result.current.state.visibleNodes).not.toContain('uuid-3');
    });
  });

  describe('Requirement 2.11: Perform BFS to find nodes within N hops', () => {
    it('should include nodes 1 hop away when level=1', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Login Feature',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-3',
          title: 'Unrelated Task',
          version: 1,
          creator: 'user1',
          priority: 'low',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-2' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 1 });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).toContain('uuid-2');
      expect(result.current.state.visibleNodes).not.toContain('uuid-3');
    });

    it('should include nodes 2 hops away when level=2', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Login Feature',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-3',
          title: 'Password Reset',
          version: 1,
          creator: 'user1',
          priority: 'medium',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-4',
          title: 'Unrelated Task',
          version: 1,
          creator: 'user1',
          priority: 'low',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-2' },
        { id: 'rel-2', type: 'DEPENDS_ON', source: 'uuid-2', target: 'uuid-3' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 2 });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).toContain('uuid-2');
      expect(result.current.state.visibleNodes).toContain('uuid-3');
      expect(result.current.state.visibleNodes).not.toContain('uuid-4');
    });

    it('should work with bidirectional relationships', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Login Feature',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'DEPENDS_ON', source: 'uuid-2', target: 'uuid-1' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 1 });
      });

      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).toContain('uuid-2');
    });

    it('should handle complex graph with multiple paths', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Task A',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-3',
          title: 'Task B',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-4',
          title: 'Task C',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-2' },
        { id: 'rel-2', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-3' },
        { id: 'rel-3', type: 'DEPENDS_ON', source: 'uuid-2', target: 'uuid-4' },
        { id: 'rel-4', type: 'DEPENDS_ON', source: 'uuid-3', target: 'uuid-4' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 2 });
      });

      // All nodes should be visible within 2 hops
      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).toContain('uuid-2');
      expect(result.current.state.visibleNodes).toContain('uuid-3');
      expect(result.current.state.visibleNodes).toContain('uuid-4');
    });
  });

  describe('Requirement 2.12: Update derived state', () => {
    it('should update visibleNodes when text search changes', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Database',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
      });

      expect(result.current.state.visibleNodes).toHaveLength(2);

      act(() => {
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
      });

      expect(result.current.state.visibleNodes).toHaveLength(1);
      expect(result.current.state.visibleNodes).toContain('uuid-1');
    });

    it('should update visibleEdges when text search changes', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Login',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-3',
          title: 'Database',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-2' },
        { id: 'rel-2', type: 'DEPENDS_ON', source: 'uuid-2', target: 'uuid-3' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
      });

      expect(result.current.state.visibleEdges).toHaveLength(2);

      act(() => {
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 1 });
      });

      // Only rel-1 should be visible (connects uuid-1 and uuid-2)
      expect(result.current.state.visibleEdges).toHaveLength(1);
      expect(result.current.state.visibleEdges).toContain('rel-1');
    });

    it('should remove edges with filtered endpoints', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Database',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'DEPENDS_ON', source: 'uuid-1', target: 'uuid-2' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 0 });
      });

      // Edge should be removed because uuid-2 is filtered out
      expect(result.current.state.visibleEdges).toHaveLength(0);
    });

    it('should clear text search when empty string is provided', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Database',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
      });

      expect(result.current.state.visibleNodes).toHaveLength(1);

      act(() => {
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: '' });
      });

      expect(result.current.state.visibleNodes).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle level=0 correctly (only matching nodes)', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Login',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-2' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 0 });
      });

      expect(result.current.state.visibleNodes).toHaveLength(1);
      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleEdges).toHaveLength(0);
    });

    it('should handle no matching nodes', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'NonExistent' });
      });

      expect(result.current.state.visibleNodes).toHaveLength(0);
    });

    it('should handle disconnected graph components', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const minds: Mind[] = [
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-1',
          title: 'Authentication',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-2',
          title: 'Login',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
        {
          __primarylabel__: 'Project',
          uuid: 'uuid-3',
          title: 'Database',
          version: 1,
          creator: 'user1',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        {
          __primarylabel__: 'Task',
          uuid: 'uuid-4',
          title: 'Schema',
          version: 1,
          creator: 'user1',
          priority: 'high',
          assignee: 'user1',
        },
      ];

      const relationships: Relationship[] = [
        { id: 'rel-1', type: 'CONTAINS', source: 'uuid-1', target: 'uuid-2' },
        { id: 'rel-2', type: 'CONTAINS', source: 'uuid-3', target: 'uuid-4' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_MINDS', payload: minds });
        result.current.dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
        result.current.dispatch({ type: 'SET_TEXT_SEARCH', payload: 'Authentication' });
        result.current.dispatch({ type: 'SET_LEVEL', payload: 1 });
      });

      // Should only include uuid-1 and uuid-2 (connected component)
      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes).toContain('uuid-2');
      expect(result.current.state.visibleNodes).not.toContain('uuid-3');
      expect(result.current.state.visibleNodes).not.toContain('uuid-4');
    });
  });
});
