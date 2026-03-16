/**
 * Additional tests for current version filtering
 * Validates Requirements 1.3, 1.4, 1.5
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  GraphEditorProvider,
  useGraphEditor,
  type Mind,
} from './GraphEditorContext';

// Test wrapper component
function wrapper({ children }: { children: ReactNode }) {
  return <GraphEditorProvider>{children}</GraphEditorProvider>;
}

describe('Current Version Filtering', () => {
  describe('Requirements 1.3, 1.4, 1.5: Display only current versions', () => {
    it('should keep only the highest version when multiple versions exist', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const mind1v1: Mind = {
        __primarylabel__: 'Project',
        uuid: 'uuid-1',
        title: 'Project v1',
        version: 1,
        creator: 'user1',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const mind1v2: Mind = {
        ...mind1v1,
        version: 2,
        title: 'Project v2',
      };

      const mind1v3: Mind = {
        ...mind1v1,
        version: 3,
        title: 'Project v3',
      };

      act(() => {
        result.current.dispatch({
          type: 'SET_MINDS',
          payload: [mind1v1, mind1v2, mind1v3],
        });
      });

      // Should only have one mind in the map
      expect(result.current.state.minds.size).toBe(1);
      
      // Should be version 3
      const storedMind = result.current.state.minds.get('uuid-1');
      expect(storedMind?.version).toBe(3);
      expect(storedMind?.title).toBe('Project v3');
    });

    it('should handle multiple minds with different versions correctly', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const mind1v1: Mind = {
        __primarylabel__: 'Project',
        uuid: 'uuid-1',
        title: 'Project v1',
        version: 1,
        creator: 'user1',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const mind1v2: Mind = {
        ...mind1v1,
        version: 2,
        title: 'Project v2',
      };

      const mind2v1: Mind = {
        __primarylabel__: 'Task',
        uuid: 'uuid-2',
        title: 'Task v1',
        version: 1,
        creator: 'user1',
        priority: 'high',
      };

      const mind2v3: Mind = {
        ...mind2v1,
        version: 3,
        title: 'Task v3',
      };

      const mind3v1: Mind = {
        __primarylabel__: 'Company',
        uuid: 'uuid-3',
        title: 'Company v1',
        version: 1,
        creator: 'user1',
        industry: 'Technology',
      };

      act(() => {
        result.current.dispatch({
          type: 'SET_MINDS',
          payload: [mind1v1, mind1v2, mind2v1, mind2v3, mind3v1],
        });
      });

      // Should have 3 minds (one per UUID)
      expect(result.current.state.minds.size).toBe(3);
      
      // Check each mind has the highest version
      expect(result.current.state.minds.get('uuid-1')?.version).toBe(2);
      expect(result.current.state.minds.get('uuid-2')?.version).toBe(3);
      expect(result.current.state.minds.get('uuid-3')?.version).toBe(1);
    });

    it('should handle versions in non-sequential order', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const mind1v3: Mind = {
        __primarylabel__: 'Project',
        uuid: 'uuid-1',
        title: 'Project v3',
        version: 3,
        creator: 'user1',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const mind1v1: Mind = {
        ...mind1v3,
        version: 1,
        title: 'Project v1',
      };

      const mind1v2: Mind = {
        ...mind1v3,
        version: 2,
        title: 'Project v2',
      };

      // Provide versions in non-sequential order
      act(() => {
        result.current.dispatch({
          type: 'SET_MINDS',
          payload: [mind1v3, mind1v1, mind1v2],
        });
      });

      // Should still keep version 3
      expect(result.current.state.minds.size).toBe(1);
      expect(result.current.state.minds.get('uuid-1')?.version).toBe(3);
      expect(result.current.state.minds.get('uuid-1')?.title).toBe('Project v3');
    });

    it('should handle undefined version numbers gracefully', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const mind1NoVersion: Mind = {
        __primarylabel__: 'Project',
        uuid: 'uuid-1',
        title: 'Project no version',
        creator: 'user1',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const mind1v2: Mind = {
        ...mind1NoVersion,
        version: 2,
        title: 'Project v2',
      };

      act(() => {
        result.current.dispatch({
          type: 'SET_MINDS',
          payload: [mind1NoVersion, mind1v2],
        });
      });

      // Should keep the one with version 2
      expect(result.current.state.minds.size).toBe(1);
      expect(result.current.state.minds.get('uuid-1')?.version).toBe(2);
      expect(result.current.state.minds.get('uuid-1')?.title).toBe('Project v2');
    });

    it('should only show current version in visible nodes', () => {
      const { result } = renderHook(() => useGraphEditor(), { wrapper });

      const mind1v1: Mind = {
        __primarylabel__: 'Project',
        uuid: 'uuid-1',
        title: 'Project v1',
        version: 1,
        creator: 'user1',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const mind1v2: Mind = {
        ...mind1v1,
        version: 2,
        title: 'Project v2',
      };

      act(() => {
        result.current.dispatch({
          type: 'SET_MINDS',
          payload: [mind1v1, mind1v2],
        });
      });

      // Should have uuid-1 in visible nodes
      expect(result.current.state.visibleNodes).toContain('uuid-1');
      expect(result.current.state.visibleNodes.length).toBe(1);
    });
  });
});
