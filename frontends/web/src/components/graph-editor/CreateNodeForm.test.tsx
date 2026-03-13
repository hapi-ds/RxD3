/**
 * CreateNodeForm Component Tests
 * 
 * Tests:
 * - Form renders with correct fields for node type
 * - Required field validation
 * - Form submission calls API and updates state
 * - Success/error toast notifications
 * - Cancel button behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateNodeForm } from './CreateNodeForm';
import { GraphEditorProvider } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';
import { ScreenReaderAnnouncerProvider } from './ScreenReaderAnnouncer';
import { mindsAPI } from '../../services/api';
import type { Mind } from '../../types/generated';

// Mock the API
vi.mock('../../services/api', () => ({
  mindsAPI: {
    create: vi.fn(),
  },
}));

// Helper to render component with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <GraphEditorProvider>
      <ToastProvider>
        <ScreenReaderAnnouncerProvider>
          {ui}
        </ScreenReaderAnnouncerProvider>
      </ToastProvider>
    </GraphEditorProvider>
  );
}

describe('CreateNodeForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with correct fields for Project node type', () => {
    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Check header
    expect(screen.getByText('Create Project')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();

    // Check base fields
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/creator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();

    // Check Project-specific fields
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();

    // Check buttons
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders form with correct fields for Task node type', () => {
    renderWithProviders(
      <CreateNodeForm
        nodeType="Task"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Check Task-specific fields
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
  });

  it('marks required fields with indicator', () => {
    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Title and creator are required
    const titleLabel = screen.getByText(/title/i).closest('label');
    const creatorLabel = screen.getByText(/creator/i).closest('label');

    expect(titleLabel).toHaveTextContent('*');
    expect(creatorLabel).toHaveTextContent('*');
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit without filling required fields
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    // API should not be called
    expect(mindsAPI.create).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    const mockCreatedMind: Mind = {
      __primarylabel__: 'Project',
      uuid: 'test-uuid-123',
      title: 'Test Project',
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      creator: 'test-user',
      status: 'draft',
      description: null,
      tags: null,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      budget: null,
    };

    vi.mocked(mindsAPI.create).mockResolvedValue(mockCreatedMind);

    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Project');
    await user.type(screen.getByLabelText(/creator/i), 'test-user');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
    await user.type(screen.getByLabelText(/end date/i), '2024-12-31');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Wait for API call
    await waitFor(() => {
      expect(mindsAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          __primarylabel__: 'Project',
          title: 'Test Project',
          creator: 'test-user',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        })
      );
    });

    // Success callback should be called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedMind);
    });
  });

  it('handles API error gracefully', async () => {
    const user = userEvent.setup();

    vi.mocked(mindsAPI.create).mockRejectedValue(new Error('API Error'));

    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Project');
    await user.type(screen.getByLabelText(/creator/i), 'test-user');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
    await user.type(screen.getByLabelText(/end date/i), '2024-12-31');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Wait for error handling
    await waitFor(() => {
      expect(mindsAPI.create).toHaveBeenCalled();
    });

    // Success callback should NOT be called
    expect(mockOnSuccess).not.toHaveBeenCalled();

    // Form should remain open (not call onSuccess)
    expect(createButton).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables buttons while submitting', async () => {
    const user = userEvent.setup();

    // Make API call hang
    vi.mocked(mindsAPI.create).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
      <CreateNodeForm
        nodeType="Project"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Project');
    await user.type(screen.getByLabelText(/creator/i), 'test-user');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
    await user.type(screen.getByLabelText(/end date/i), '2024-12-31');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Buttons should be disabled
    await waitFor(() => {
      expect(createButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });
});
