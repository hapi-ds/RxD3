/**
 * GraphEditorLayout Component
 * Three-panel layout for the Mind Graph Editor
 * 
 * Layout Structure:
 * - Left: VersionHistoryPanel (300px fixed width, permanent)
 * - Center: GraphVisualizationArea (flexible width)
 * - Right: AttributeEditor (flexible width)
 * 
 * Uses CSS Grid for responsive layout
 * Assumes it's wrapped in GraphEditorProvider
 * 
 * Features:
 * - Keyboard shortcuts for common operations
 * - Undo/Redo (Ctrl+Z / Ctrl+Shift+Z or Cmd+Z / Cmd+Shift+Z)
 * - Delete selected node/edge (Delete key)
 * - Clear selection (Escape key)
 * 
 * Requirements: 1.3, 4.2, 9.3, 18.1, 18.2, 18.3, 18.4
 */

import { useEffect, useState } from 'react';
import { GraphCanvasWithProvider } from './GraphCanvas';
import { AttributeEditor } from './AttributeEditor';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useGraphEditor } from './GraphEditorContext';
import { useScreenReaderAnnouncer } from './ScreenReaderAnnouncer';
import { mindsAPI, relationshipsAPI } from '../../services/api';
import { useToast } from './ToastContext';
import './GraphEditorLayout.css';

/**
 * Hook to detect if viewport is in tablet mode (768px - 1024px)
 */
function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width <= 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
}

/**
 * GraphEditorLayout Component
 * Provides the main three-panel layout structure for the graph editor
 * with keyboard shortcut support
 */
export function GraphEditorLayout() {
  const { state, dispatch } = useGraphEditor();
  const { showToast } = useToast();
  const { announceSelectionChange, announceCRUDOperation } = useScreenReaderAnnouncer();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const isTablet = useIsTablet();

  // Announce selection changes
  useEffect(() => {
    if (state.selection.selectedNodeId) {
      const node = state.minds.get(state.selection.selectedNodeId);
      if (node) {
        announceSelectionChange('node', node.title);
      }
    } else if (state.selection.selectedEdgeId) {
      const edge = state.relationships.get(state.selection.selectedEdgeId);
      if (edge) {
        announceSelectionChange('edge', edge.type);
      }
    }
    // Note: We don't announce deselection to avoid spam on initial load
  }, [state.selection.selectedNodeId, state.selection.selectedEdgeId, state.minds, state.relationships, announceSelectionChange]);

  useEffect(() => {
    /**
     * Check if the active element is an input field
     * Don't trigger shortcuts when user is typing
     */
    const isInputActive = (): boolean => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;
      
      const tagName = activeElement.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        (activeElement as HTMLElement).isContentEditable
      );
    };

    /**
     * Handle keyboard events for shortcuts
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (isInputActive()) {
        return;
      }

      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl+Z / Cmd+Z - Undo
      if (modifierKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (state.canUndo) {
          dispatch({ type: 'UNDO' });
        }
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if (modifierKey && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        if (state.canRedo) {
          dispatch({ type: 'REDO' });
        }
        return;
      }

      // Delete key - Delete selected node or edge
      if (event.key === 'Delete') {
        event.preventDefault();
        
        // Delete selected node
        if (state.selection.selectedNodeId) {
          const nodeId = state.selection.selectedNodeId;
          const node = state.minds.get(nodeId);
          
          if (node) {
            // Show confirmation
            const confirmed = window.confirm(
              `Are you sure you want to delete "${node.title}"? This will also delete all connected relationships.`
            );
            
            if (confirmed) {
              mindsAPI.delete(nodeId)
                .then(() => {
                  dispatch({ type: 'DELETE_MIND', payload: nodeId });
                  showToast('success', 'Node deleted successfully');
                  announceCRUDOperation('deleted', 'node', node.title);
                })
                .catch((error) => {
                  const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to delete node';
                  showToast('error', errorMessage);
                  console.error('Error deleting node:', error);
                });
            }
          }
          return;
        }
        
        // Delete selected edge
        if (state.selection.selectedEdgeId) {
          const edgeId = state.selection.selectedEdgeId;
          const edge = state.relationships.get(edgeId);
          
          if (edge) {
            // Show confirmation
            const confirmed = window.confirm(
              `Are you sure you want to delete this relationship?`
            );
            
            if (confirmed) {
              relationshipsAPI.delete(edgeId)
                .then(() => {
                  dispatch({ type: 'DELETE_RELATIONSHIP', payload: edgeId });
                  showToast('success', 'Relationship deleted successfully');
                  announceCRUDOperation('deleted', 'relationship');
                })
                .catch((error) => {
                  const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to delete relationship';
                  showToast('error', errorMessage);
                  console.error('Error deleting relationship:', error);
                });
            }
          }
          return;
        }
      }

      // Escape key - Clear selection
      if (event.key === 'Escape') {
        event.preventDefault();
        if (state.selection.selectedNodeId || state.selection.selectedEdgeId) {
          dispatch({ type: 'SELECT_NODE', payload: null });
          dispatch({ type: 'SELECT_EDGE', payload: null });
        }
        return;
      }

      // ? key - Show keyboard shortcuts help
      if (event.key === '?') {
        event.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state, dispatch, showToast]);

  return (
    <div className="graph-editor-layout">
      {/* Toggle button for tablet mode */}
      {isTablet && (
        <button
          className="version-panel-toggle"
          onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
          aria-label={isVersionPanelOpen ? 'Close version history panel' : 'Open version history panel'}
          aria-expanded={isVersionPanelOpen}
        >
          <span className="toggle-icon">{isVersionPanelOpen ? '✕' : '☰'}</span>
          <span className="toggle-label">Version History</span>
        </button>
      )}
      
      <aside 
        className={`version-history-panel-container ${isTablet && isVersionPanelOpen ? 'open' : ''} ${isTablet && !isVersionPanelOpen ? 'closed' : ''}`}
        role="complementary" 
        aria-label="Version History"
        aria-hidden={isTablet && !isVersionPanelOpen}
      >
        <VersionHistoryPanel />
      </aside>
      
      {/* Overlay for tablet mode when panel is open */}
      {isTablet && isVersionPanelOpen && (
        <div 
          className="version-panel-overlay"
          onClick={() => setIsVersionPanelOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <main 
        className="graph-visualization-area-container" 
        role="main" 
        aria-label="Graph Visualization"
      >
        <GraphCanvasWithProvider />
      </main>
      <aside 
        className="attribute-editor-container" 
        role="complementary" 
        aria-label="Attribute Editor"
      >
        <AttributeEditor />
      </aside>
      
      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}
