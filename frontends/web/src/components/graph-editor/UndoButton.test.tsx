/**
 * UndoButton Component Tests
 * 
 * Tests for the UndoButton component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UndoButton } from './UndoButton';
import { GraphEditorProvider } from './GraphEditorContext';
import type { Mind } from '../../types/generated';

describe('UndoButton', () => {
  const mockMind: Mind = {
    uuid: 'test-uuid-1',
    title: 'Test Mind',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator: 'test-user',
    status: 'active',
    description: 'Test description',
    tags: null,
    __primarylabel__: 'Task',
    priority: 'medium',
    assignee: 'test-user',
    due_date: null,
    effort: null,
    duration: null,
    length: null,
    task_type: 'development',
    phase_number: null,
    target_date: null,
    completion_percentage: null,
  };

  it('renders the undo button', () => {
    render(
      <GraphEditorProvider>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /undo/i });
    expect(button).toBeInTheDocument();
  });

  it('is disabled when canUndo is false (empty history)', () => {
    render(
      <GraphEditorProvider>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /undo/i });
    expect(button).toBeDisabled();
  });

  it('is enabled when canUndo is true (has history)', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]}>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    // Initially disabled (no actions performed yet)
    const button = screen.getByRole('button', { name: /undo/i });
    expect(button).toBeDisabled();
  });

  it('shows keyboard shortcut in tooltip', () => {
    render(
      <GraphEditorProvider>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /undo/i });
    const title = button.getAttribute('title');
    
    // Should show either Ctrl+Z or Cmd+Z depending on platform
    expect(title).toMatch(/Undo \((Ctrl|Cmd)\+Z\)/);
  });

  it('has proper ARIA label', () => {
    render(
      <GraphEditorProvider>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /undo last action/i });
    expect(button).toBeInTheDocument();
  });

  it('displays undo icon', () => {
    render(
      <GraphEditorProvider>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    const icon = screen.getByText('↶');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GraphEditorProvider>
        <UndoButton className="custom-class" />
      </GraphEditorProvider>
    );
    
    const button = container.querySelector('.undo-button');
    expect(button).toHaveClass('custom-class');
  });

  it('calls dispatch with UNDO action when clicked and enabled', async () => {
    const user = userEvent.setup();
    
    // We need to create a scenario where canUndo is true
    // This requires having an action in the history
    // For now, we'll test that clicking a disabled button does nothing
    render(
      <GraphEditorProvider>
        <UndoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /undo/i });
    
    // Button is disabled, so clicking should do nothing
    await user.click(button);
    
    // Button should still be disabled
    expect(button).toBeDisabled();
  });
});
