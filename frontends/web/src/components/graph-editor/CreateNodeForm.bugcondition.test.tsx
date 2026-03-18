/**
 * Bug condition exploration tests for CreateNodeForm payload structure.
 *
 * These tests encode the EXPECTED behavior — they will FAIL on unfixed code,
 * confirming the bug exists (handleSubmit sends flat payload without mind_type
 * or type_specific_attributes).
 *
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateNodeForm } from './CreateNodeForm';
import { GraphEditorProvider } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';
import { ScreenReaderAnnouncerProvider } from './ScreenReaderAnnouncer';
import { mindsAPI } from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  mindsAPI: {
    create: vi.fn(),
  },
}));

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

describe('CreateNodeForm Bug Condition - Payload Structure', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock create to resolve so the form completes submission
    vi.mocked(mindsAPI.create).mockResolvedValue({
      __primarylabel__: 'Failure',
      uuid: 'test-uuid',
      title: 'Motor Overheating',
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      creator: 'user1',
      status: 'draft',
      description: null,
      tags: null,
      occurrence: 5,
      detectability: 3,
    });
  });

  it('payload should include mind_type set to the selected node type', async () => {
    /**
     * Bug condition: handleSubmit never adds mind_type to the payload.
     * Expected: payload includes mind_type: "Failure"
     * Will FAIL on unfixed code.
     *
     * **Validates: Requirements 1.1, 2.1**
     */
    const user = userEvent.setup();

    renderWithProviders(
      <CreateNodeForm
        nodeType="Failure"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Motor Overheating');
    await user.type(screen.getByLabelText(/creator/i), 'user1');

    // Fill type-specific fields
    const occurrenceInput = screen.getByLabelText(/occurrence/i);
    await user.type(occurrenceInput, '5');
    const detectabilityInput = screen.getByLabelText(/detectability/i);
    await user.type(detectabilityInput, '3');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Wait for API call and capture payload
    await waitFor(() => {
      expect(mindsAPI.create).toHaveBeenCalled();
    });

    const payload = vi.mocked(mindsAPI.create).mock.calls[0][0] as Record<string, unknown>;

    // Assert mind_type is present (will FAIL - handleSubmit never adds it)
    expect(payload).toHaveProperty('mind_type', 'Failure');
  });

  it('payload should nest type-specific fields inside type_specific_attributes', async () => {
    /**
     * Bug condition: handleSubmit puts all fields flat at top level.
     * Expected: occurrence and detectability nested in type_specific_attributes
     * Will FAIL on unfixed code.
     *
     * **Validates: Requirements 1.2, 2.2**
     */
    const user = userEvent.setup();

    renderWithProviders(
      <CreateNodeForm
        nodeType="Failure"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Motor Overheating');
    await user.type(screen.getByLabelText(/creator/i), 'user1');

    // Fill type-specific fields
    const occurrenceInput = screen.getByLabelText(/occurrence/i);
    await user.type(occurrenceInput, '5');
    const detectabilityInput = screen.getByLabelText(/detectability/i);
    await user.type(detectabilityInput, '3');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mindsAPI.create).toHaveBeenCalled();
    });

    const payload = vi.mocked(mindsAPI.create).mock.calls[0][0] as Record<string, unknown>;

    // Assert type_specific_attributes contains occurrence and detectability
    // (will FAIL - payload is flat, no type_specific_attributes key)
    expect(payload).toHaveProperty('type_specific_attributes');
    const typeAttrs = payload.type_specific_attributes as Record<string, unknown>;
    expect(typeAttrs).toHaveProperty('occurrence', 5);
    expect(typeAttrs).toHaveProperty('detectability', 3);
  });

  it('payload should NOT have type-specific fields at top level', async () => {
    /**
     * Bug condition: handleSubmit puts occurrence/detectability at top level.
     * Expected: they should only be inside type_specific_attributes
     * Will FAIL on unfixed code.
     *
     * **Validates: Requirements 1.2, 2.2**
     */
    const user = userEvent.setup();

    renderWithProviders(
      <CreateNodeForm
        nodeType="Failure"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Motor Overheating');
    await user.type(screen.getByLabelText(/creator/i), 'user1');

    // Fill type-specific fields
    const occurrenceInput = screen.getByLabelText(/occurrence/i);
    await user.type(occurrenceInput, '5');
    const detectabilityInput = screen.getByLabelText(/detectability/i);
    await user.type(detectabilityInput, '3');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mindsAPI.create).toHaveBeenCalled();
    });

    const payload = vi.mocked(mindsAPI.create).mock.calls[0][0] as Record<string, unknown>;

    // Assert occurrence and detectability are NOT at top level
    // (will FAIL - they ARE at top level in unfixed code)
    expect(payload).not.toHaveProperty('occurrence');
    expect(payload).not.toHaveProperty('detectability');
  });
});
