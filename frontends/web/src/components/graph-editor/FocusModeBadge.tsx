/**
 * FocusModeBadge Component
 * Displays a badge when focus mode is active with the focused node name
 * and provides a button to exit focus mode
 * 
 * Performance Optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Event handler uses useCallback for stable reference
 * 
 * **Validates: Requirements 3.5, 9.11**
 */

import { memo, useCallback } from 'react';
import { useGraphEditor, type UUID } from './GraphEditorContext';
import { useScreenReaderAnnouncer } from './ScreenReaderAnnouncer';
import './FocusModeBadge.css';

export const FocusModeBadge = memo(function FocusModeBadge() {
  const { state, dispatch } = useGraphEditor();
  const { announceFilterChange } = useScreenReaderAnnouncer();
  const { focusedNodeId } = state.filters;

  const handleExitFocus = useCallback(() => {
    dispatch({ type: 'SET_FOCUS_MODE', payload: null });
    
    // Announce focus mode exit
    announceFilterChange('Focus mode', 'deactivated');
  }, [dispatch, announceFilterChange]);

  if (!focusedNodeId) {
    return null;
  }

  const focusedNode = state.minds.get(focusedNodeId as UUID);
  
  if (!focusedNode) {
    return null;
  }

  return (
    <div className="focus-mode-badge" role="status" aria-live="polite">
      <div className="focus-mode-content">
        <span className="focus-mode-icon">🎯</span>
        <div className="focus-mode-text">
          <span className="focus-mode-label">Focus Mode</span>
          <span className="focus-mode-node-title">{focusedNode.title}</span>
        </div>
      </div>
      <button
        className="focus-mode-exit-button"
        onClick={handleExitFocus}
        aria-label="Exit focus mode"
        title="Exit focus mode (or Shift+click the focused node)"
      >
        ✕
      </button>
    </div>
  );
});
