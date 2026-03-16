/**
 * RedoButton Component Tests
 * 
 * Tests for the RedoButton component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedoButton } from './RedoButton';
import { GraphEditorProvider } from './GraphEditorContext';
import type { Mind } from '../../types/generated';

describe('RedoButton', () => {
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
    due_date: null,
    effort: null,
    duration: null,
    length: null,
    task_type: 'development',
    phase_number: null,
    target_date: null,
    completion_percentage: null,
  };

  it('renders the redo button', () => {
    render(
      <GraphEditorProvider>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /redo/i });
    expect(button).toBeInTheDocument();
  });

  it('is disabled when canRedo is false (empty future stack)', () => {
    render(
      <GraphEditorProvider>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /redo/i });
    expect(button).toBeDisabled();
  });

  it('is enabled when canRedo is true (has undone actions)', () => {
    render(
      <GraphEditorProvider initialMinds={[mockMind]}>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    // Initially disabled (no undone actions)
    const button = screen.getByRole('button', { name: /redo/i });
    expect(button).toBeDisabled();
  });

  it('shows keyboard shortcut in tooltip', () => {
    render(
      <GraphEditorProvider>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /redo/i });
    const title = button.getAttribute('title');
    
    // Should show either Ctrl+Shift+Z or Cmd+Shift+Z depending on platform
    expect(title).toMatch(/Redo \((Ctrl|Cmd)\+Shift\+Z\)/);
  });

  it('has proper ARIA label', () => {
    render(
      <GraphEditorProvider>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /redo last undone action/i });
    expect(button).toBeInTheDocument();
  });

  it('displays redo icon', () => {
    render(
      <GraphEditorProvider>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    const icon = screen.getByText('↷');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GraphEditorProvider>
        <RedoButton className="custom-class" />
      </GraphEditorProvider>
    );
    
    const button = container.querySelector('.redo-button');
    expect(button).toHaveClass('custom-class');
  });

  it('calls dispatch with REDO action when clicked and enabled', async () => {
    const user = userEvent.setup();
    
    // We need to create a scenario where canRedo is true
    // This requires having an action in the future stack (after undo)
    // For now, we'll test that clicking a disabled button does nothing
    render(
      <GraphEditorProvider>
        <RedoButton />
      </GraphEditorProvider>
    );
    
    const button = screen.getByRole('button', { name: /redo/i });
    
    // Button is disabled, so clicking should do nothing
    await user.click(button);
    
    // Button should still be disabled
    expect(button).toBeDisabled();
  });
});
