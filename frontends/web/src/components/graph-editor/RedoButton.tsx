/**
 * RedoButton Component
 * Button to redo the last undone action
 * 
 * Features:
 * - Dispatches REDO action to GraphEditorContext
 * - Disabled when redo stack is empty (canRedo flag)
 * - Shows keyboard shortcut in tooltip (Ctrl+Shift+Z / Cmd+Shift+Z)
 * - Accessible with ARIA labels
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Event handler uses useCallback for stable reference
 * 
 * **Validates: Requirements 16.3, 16.7, 9.11**
 */

import { memo, useCallback } from 'react';
import { useGraphEditor } from './GraphEditorContext';
import './RedoButton.css';

export interface RedoButtonProps {
  className?: string;
}

/**
 * RedoButton Component
 * Provides redo functionality for graph editing operations
 */
export const RedoButton = memo(function RedoButton({ className = '' }: RedoButtonProps) {
  const { state, dispatch } = useGraphEditor();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  const shortcut = isMac ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z';

  const handleRedo = useCallback(() => {
    if (state.canRedo) {
      dispatch({ type: 'REDO' });
    }
  }, [state.canRedo, dispatch]);

  return (
    <button
      className={`redo-button ${className}`}
      onClick={handleRedo}
      disabled={!state.canRedo}
      title={`Redo (${shortcut})`}
      aria-label={`Redo last undone action (${shortcut})`}
    >
      <span className="redo-icon" aria-hidden="true">↷</span>
      <span className="redo-label">Redo</span>
    </button>
  );
});
