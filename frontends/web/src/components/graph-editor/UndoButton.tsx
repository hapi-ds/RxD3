/**
 * UndoButton Component
 * Button to undo the last editing action
 * 
 * Features:
 * - Dispatches UNDO action to GraphEditorContext
 * - Disabled when undo stack is empty (canUndo flag)
 * - Shows keyboard shortcut in tooltip (Ctrl+Z / Cmd+Z)
 * - Accessible with ARIA labels
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Event handler uses useCallback for stable reference
 * 
 * **Validates: Requirements 16.2, 16.6, 9.11**
 */

import { memo, useCallback } from 'react';
import { useGraphEditor } from './GraphEditorContext';
import './UndoButton.css';

export interface UndoButtonProps {
  className?: string;
}

/**
 * UndoButton Component
 * Provides undo functionality for graph editing operations
 */
export const UndoButton = memo(function UndoButton({ className = '' }: UndoButtonProps) {
  const { state, dispatch } = useGraphEditor();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  const shortcut = isMac ? 'Cmd+Z' : 'Ctrl+Z';

  const handleUndo = useCallback(() => {
    if (state.canUndo) {
      dispatch({ type: 'UNDO' });
    }
  }, [state.canUndo, dispatch]);

  return (
    <button
      className={`undo-button ${className}`}
      onClick={handleUndo}
      disabled={!state.canUndo}
      title={`Undo (${shortcut})`}
      aria-label={`Undo last action (${shortcut})`}
    >
      <span className="undo-icon" aria-hidden="true">↶</span>
      <span className="undo-label">Undo</span>
    </button>
  );
});
