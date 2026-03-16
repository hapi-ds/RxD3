/**
 * Undo/Redo Integration Tests
 * 
 * Tests for undo/redo functionality with GraphEditorContext
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphEditorProvider, useGraphEditor } from './GraphEditorContext';
import { UndoButton } from './UndoButton';
import { RedoButton } from './RedoButton';
import type { Mind } from '../../types/generated';

// Test component that allows us to interact with the context
function TestComponent() {
  const { state, dispatch } = useGraphEditor();
  let mindCounter = 0;

  const addMind = () => {
    mindCounter++;
    const newMind: Mind = {
      uuid: `test-uuid-${Date.now()}-${Math.random()}`,
      title: `New Mind ${mindCounter}`,
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
    dispatch({ type: 'ADD_MIND', payload: newMind });
  };

  return (
    <div>
      <button onClick={addMind}>Add Mind</button>
      <UndoButton />
      <RedoButton />
      <div data-testid="mind-count">{state.minds.size}</div>
      <div data-testid="can-undo">{state.canUndo ? 'true' : 'false'}</div>
      <div data-testid="can-redo">{state.canRedo ? 'true' : 'false'}</div>
    </div>
  );
}

describe('Undo/Redo Integration', () => {
  it('enables undo button after adding a mind', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphEditorProvider>
        <TestComponent />
      </GraphEditorProvider>
    );

    // Initially, undo should be disabled
    const undoButton = screen.getByRole('button', { name: /undo last action/i });
    expect(undoButton).toBeDisabled();
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');

    // Add a mind
    const addButton = screen.getByRole('button', { name: /add mind/i });
    await user.click(addButton);

    // Now undo should be enabled
    expect(undoButton).not.toBeDisabled();
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    expect(screen.getByTestId('mind-count')).toHaveTextContent('1');
  });

  it('undoes adding a mind', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphEditorProvider>
        <TestComponent />
      </GraphEditorProvider>
    );

    // Add a mind
    const addButton = screen.getByRole('button', { name: /add mind/i });
    await user.click(addButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('1');

    // Undo the addition
    const undoButton = screen.getByRole('button', { name: /undo last action/i });
    await user.click(undoButton);

    // Mind should be removed
    expect(screen.getByTestId('mind-count')).toHaveTextContent('0');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
  });

  it('redoes adding a mind after undo', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphEditorProvider>
        <TestComponent />
      </GraphEditorProvider>
    );

    // Add a mind
    const addButton = screen.getByRole('button', { name: /add mind/i });
    await user.click(addButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('1');

    // Undo the addition
    const undoButton = screen.getByRole('button', { name: /undo last action/i });
    await user.click(undoButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('0');

    // Redo the addition
    const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
    await user.click(redoButton);

    // Mind should be back
    expect(screen.getByTestId('mind-count')).toHaveTextContent('1');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
  });

  it('clears redo stack when new action is performed', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphEditorProvider>
        <TestComponent />
      </GraphEditorProvider>
    );

    // Add a mind
    const addButton = screen.getByRole('button', { name: /add mind/i });
    await user.click(addButton);

    // Undo the addition
    const undoButton = screen.getByRole('button', { name: /undo last action/i });
    await user.click(undoButton);
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');

    // Add another mind (new action)
    await user.click(addButton);

    // Redo should now be disabled (future stack cleared)
    expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
  });

  it('handles multiple undo/redo operations', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphEditorProvider>
        <TestComponent />
      </GraphEditorProvider>
    );

    const addButton = screen.getByRole('button', { name: /add mind/i });
    const undoButton = screen.getByRole('button', { name: /undo last action/i });
    const redoButton = screen.getByRole('button', { name: /redo last undone action/i });

    // Add 3 minds
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('3');

    // Undo twice
    await user.click(undoButton);
    await user.click(undoButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('1');

    // Redo once
    await user.click(redoButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('2');

    // Undo all
    await user.click(undoButton);
    await user.click(undoButton);
    expect(screen.getByTestId('mind-count')).toHaveTextContent('0');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
  });
});
