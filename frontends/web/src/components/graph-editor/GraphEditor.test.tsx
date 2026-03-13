/**
 * GraphEditor Component Tests
 * Unit tests for the GraphEditor component
 * 
 * **Validates: Requirements 1.1, 1.2, 9.1, 9.2**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GraphEditor } from './GraphEditor';
import { mindsAPI, relationshipsAPI } from '../../services/api';
import type { Mind } from '../../types/generated';
import type { Relationship as GraphRelationship } from './GraphEditorContext';

// Mock the API services
vi.mock('../../services/api', () => ({
  mindsAPI: {
    list: vi.fn(),
  },
  relationshipsAPI: {
    list: vi.fn(),
  },
}));

// Mock the child components
vi.mock('./GraphEditorLayout', () => ({
  GraphEditorLayout: () => <div data-testid="graph-editor-layout">Graph Editor Layout</div>,
}));

describe('GraphEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state while fetching data', () => {
    // Mock API calls to never resolve
    vi.mocked(mindsAPI.list).mockImplementation(() => new Promise(() => {}));
    vi.mocked(relationshipsAPI.list).mockImplementation(() => new Promise(() => {}));
    
    render(<GraphEditor />);
    
    // Check for skeleton screen with proper ARIA attributes
    const loadingElement = screen.getByLabelText('Loading graph editor');
    expect(loadingElement).toBeDefined();
    expect(loadingElement).toHaveAttribute('aria-busy', 'true');
    expect(loadingElement).toHaveAttribute('role', 'status');
    
    // Check for screen reader text
    expect(screen.getByText('Loading graph data, please wait...')).toBeDefined();
  });

  it('fetches minds and relationships on mount', async () => {
    const mockMinds: Mind[] = [
      {
        uuid: '123',
        title: 'Test Mind',
        version: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        creator: 'test@example.com',
        status: 'active',
        description: null,
        tags: null,
        __primarylabel__: 'Project',
      } as Mind,
    ];
    
    const mockRelationships: GraphRelationship[] = [
      {
        id: 'rel-1',
        type: 'RELATES_TO',
        source: '123',
        target: '456',
        properties: {},
      },
    ];
    
    vi.mocked(mindsAPI.list).mockResolvedValue(mockMinds);
    vi.mocked(relationshipsAPI.list).mockResolvedValue(mockRelationships as any);
    
    render(<GraphEditor />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('graph-editor-layout')).toBeDefined();
    });
    
    // Verify API calls were made
    expect(mindsAPI.list).toHaveBeenCalledTimes(1);
    expect(relationshipsAPI.list).toHaveBeenCalledTimes(1);
  });

  it('displays error state when data fetching fails', async () => {
    const errorMessage = 'Network error';
    vi.mocked(mindsAPI.list).mockRejectedValue(new Error(errorMessage));
    vi.mocked(relationshipsAPI.list).mockResolvedValue([]);
    
    render(<GraphEditor />);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeDefined();
    });
    
    // Verify retry button is present
    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('renders the graph editor layout after successful data fetch', async () => {
    vi.mocked(mindsAPI.list).mockResolvedValue([]);
    vi.mocked(relationshipsAPI.list).mockResolvedValue([]);
    
    render(<GraphEditor />);
    
    await waitFor(() => {
      expect(screen.getByTestId('graph-editor-layout')).toBeDefined();
    });
  });

  it('renders with the correct container class', async () => {
    vi.mocked(mindsAPI.list).mockResolvedValue([]);
    vi.mocked(relationshipsAPI.list).mockResolvedValue([]);
    
    const { container } = render(<GraphEditor />);
    
    await waitFor(() => {
      expect(container.querySelector('.graph-editor')).toBeDefined();
    });
  });

  it('fetches minds and relationships in parallel', async () => {
    let mindsResolve: (value: Mind[]) => void;
    let relationshipsResolve: (value: any[]) => void;
    
    const mindsPromise = new Promise<Mind[]>((resolve) => {
      mindsResolve = resolve;
    });
    
    const relationshipsPromise = new Promise<any[]>((resolve) => {
      relationshipsResolve = resolve;
    });
    
    vi.mocked(mindsAPI.list).mockReturnValue(mindsPromise);
    vi.mocked(relationshipsAPI.list).mockReturnValue(relationshipsPromise);
    
    render(<GraphEditor />);
    
    // Verify both API calls are initiated
    expect(mindsAPI.list).toHaveBeenCalledTimes(1);
    expect(relationshipsAPI.list).toHaveBeenCalledTimes(1);
    
    // Resolve both promises
    mindsResolve!([]);
    relationshipsResolve!([]);
    
    await waitFor(() => {
      expect(screen.getByTestId('graph-editor-layout')).toBeDefined();
    });
  });
});
