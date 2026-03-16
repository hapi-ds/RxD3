/**
 * FocusModeBadge Component Tests
 * Tests for the focus mode indicator badge
 * 
 * **Validates: Requirements 3.5**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusModeBadge } from './FocusModeBadge';
import { GraphEditorProvider } from './GraphEditorContext';
import { ScreenReaderAnnouncerProvider } from './ScreenReaderAnnouncer';
import type { Mind } from '../../types/generated';

describe('FocusModeBadge', () => {
  const mockMind: Mind = {
    uuid: 'node-1',
    title: 'Test Node',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator: 'test-user',
    status: 'active',
    description: 'Test description',
    tags: [],
    __primarylabel__: 'Task',
    priority: 'medium',
    due_date: null,
    effort: null,
    duration: null,
    length: null,
    task_type: 'development',
    phase_number: null,
    target_date: null,
    completion_percentage: null,
  };

  it('does not render when focus mode is not active', () => {
    render(
      <GraphEditorProvider>
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    // FocusModeBadge should not render (only ScreenReaderAnnouncer's live regions exist)
    expect(screen.queryByText('Focus Mode')).not.toBeInTheDocument();
  });

  it('renders when focus mode is active', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]} initialFocusedNodeId="node-1">
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    // Check for FocusModeBadge specific content
    expect(screen.getByText('Focus Mode')).toBeInTheDocument();
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('displays the focused node title', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]} initialFocusedNodeId="node-1">
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('has an exit button', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]} initialFocusedNodeId="node-1">
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    const exitButton = screen.getByRole('button', { name: /exit focus mode/i });
    expect(exitButton).toBeInTheDocument();
  });

  it('exits focus mode when exit button is clicked', () => {
    const { container } = render(
      <GraphEditorProvider initialMinds={[mockMind]} initialFocusedNodeId="node-1">
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    const exitButton = screen.getByRole('button', { name: /exit focus mode/i });
    fireEvent.click(exitButton);

    // Badge should disappear after exiting focus mode
    expect(screen.queryByText('Focus Mode')).not.toBeInTheDocument();
  });

  it('has accessible ARIA attributes', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]} initialFocusedNodeId="node-1">
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    // Find the FocusModeBadge specifically (not the ScreenReaderAnnouncer's live regions)
    const badge = screen.getByText('Focus Mode').closest('[role="status"]');
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });

  it('shows focus icon', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]} initialFocusedNodeId="node-1">
        <ScreenReaderAnnouncerProvider>
          <FocusModeBadge />
        </ScreenReaderAnnouncerProvider>
      </GraphEditorProvider>
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
  });
});
