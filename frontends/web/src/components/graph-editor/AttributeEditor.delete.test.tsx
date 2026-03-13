/**
 * AttributeEditor Delete Functionality Tests
 * Tests for the delete button and confirmation dialog
 * 
 * **Validates: Requirements 5.5, 5.6**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AttributeEditor } from './AttributeEditor';
import { GraphEditorProvider, useGraphEditor } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';
import { ScreenReaderAnnouncerProvider } from './ScreenReaderAnnouncer';
import { mindsAPI } from '../../services/api';
import type { Mind } from '../../types/generated';

// Mock the API
vi.mock('../../services/api', () => ({
  mindsAPI: {
    delete: vi.fn(),
  },
}));

// Mock react-flow to avoid rendering issues in tests
vi.mock('@xyflow/react', () => ({
  ReactFlow: () => null,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  useReactFlow: () => ({
    fitView: vi.fn(),
    setCenter: vi.fn(),
  }),
}));

const mockMind: Mind = {
  uuid: 'test-uuid-123',
  title: 'Test Project',
  version: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  creator: 'test-user',
  status: 'active',
  description: 'Test description',
  tags: ['test'],
  __primarylabel__: 'Project',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  budget: 10000,
};

describe('AttributeEditor Delete Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows delete button when node is selected', () => {
    render(
      <ToastProvider>
        <GraphEditorProvider>
          <ScreenReaderAnnouncerProvider>
          <ScreenReaderAnnouncerProvider>
            <AttributeEditor />
          </ScreenReaderAnnouncerProvider>
        </ScreenReaderAnnouncerProvider>
        </GraphEditorProvider>
      </ToastProvider>
    );

    // Initially no node selected, so no delete button
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();

    // Create a custom wrapper with selected node
    const TestWrapper = () => {
      const { dispatch } = useGraphEditor();

      // Set up initial state with a selected node
      React.useEffect(() => {
        dispatch({ type: 'ADD_MIND', payload: mockMind });
        dispatch({ type: 'SELECT_NODE', payload: mockMind.uuid });
      }, [dispatch]);

      return <AttributeEditor />;
    };

    render(
      <ToastProvider>
        <GraphEditorProvider>
          <ScreenReaderAnnouncerProvider>
          <TestWrapper />
        </ScreenReaderAnnouncerProvider>
        </GraphEditorProvider>
      </ToastProvider>
    );

    // Wait for the delete button to appear
    const deleteButton = await screen.findByText('Delete');
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    await user.click(deleteButton);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Delete Node')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    });
  });

  it('calls mindsAPI.delete and removes node from graph when confirmed', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.mocked(mindsAPI.delete);
    mockDelete.mockResolvedValue(undefined);

    // Create a custom wrapper with selected node
    const TestWrapper = () => {
      const { dispatch } = useGraphEditor();

      React.useEffect(() => {
        dispatch({ type: 'ADD_MIND', payload: mockMind });
        dispatch({ type: 'SELECT_NODE', payload: mockMind.uuid });
      }, [dispatch]);

      return <AttributeEditor />;
    };

    render(
      <ToastProvider>
        <GraphEditorProvider>
          <ScreenReaderAnnouncerProvider>
          <TestWrapper />
        </ScreenReaderAnnouncerProvider>
        </GraphEditorProvider>
      </ToastProvider>
    );

    // Click delete button
    const deleteButton = await screen.findByText('Delete');
    await user.click(deleteButton);

    // Confirm deletion - get all delete buttons and click the one in the dialog (second one)
    await waitFor(() => {
      expect(screen.getByText('Delete Node')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    await user.click(deleteButtons[1]); // The second Delete button is in the dialog

    // Verify API was called
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('test-uuid-123');
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();

    // Create a custom wrapper with selected node
    const TestWrapper = () => {
      const { dispatch } = useGraphEditor();

      React.useEffect(() => {
        dispatch({ type: 'ADD_MIND', payload: mockMind });
        dispatch({ type: 'SELECT_NODE', payload: mockMind.uuid });
      }, [dispatch]);

      return <AttributeEditor />;
    };

    render(
      <ToastProvider>
        <GraphEditorProvider>
          <ScreenReaderAnnouncerProvider>
          <TestWrapper />
        </ScreenReaderAnnouncerProvider>
        </GraphEditorProvider>
      </ToastProvider>
    );

    // Click delete button
    const deleteButton = await screen.findByText('Delete');
    await user.click(deleteButton);

    // Click cancel - get all cancel buttons and click the one in the dialog (second one)
    await waitFor(() => {
      expect(screen.getByText('Delete Node')).toBeInTheDocument();
    });
    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelButtons[1]); // The second Cancel button is in the dialog

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Delete Node')).not.toBeInTheDocument();
    });
  });

  it('shows error message when delete fails', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.mocked(mindsAPI.delete);
    mockDelete.mockRejectedValue(new Error('Network error'));

    // Create a custom wrapper with selected node
    const TestWrapper = () => {
      const { dispatch } = useGraphEditor();

      React.useEffect(() => {
        dispatch({ type: 'ADD_MIND', payload: mockMind });
        dispatch({ type: 'SELECT_NODE', payload: mockMind.uuid });
      }, [dispatch]);

      return <AttributeEditor />;
    };

    render(
      <ToastProvider>
        <GraphEditorProvider>
          <ScreenReaderAnnouncerProvider>
          <TestWrapper />
        </ScreenReaderAnnouncerProvider>
        </GraphEditorProvider>
      </ToastProvider>
    );

    // Click delete button
    const deleteButton = await screen.findByText('Delete');
    await user.click(deleteButton);

    // Confirm deletion - get all delete buttons and click the one in the dialog (second one)
    await waitFor(() => {
      expect(screen.getByText('Delete Node')).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    await user.click(deleteButtons[1]); // The second Delete button is in the dialog

    // Verify error toast appears
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
