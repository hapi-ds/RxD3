/**
 * GraphEditor Component
 * Main entry point for the Mind Graph Editor feature
 * 
 * Features:
 * - Protected route requiring authentication
 * - Three-panel layout with version history, graph visualization, and attribute editor
 * - Integration with existing authentication system
 * - Data fetching on mount for minds and relationships
 * 
 * Requirements: 1.1, 1.2, 9.1, 9.2
 */

import { useEffect } from 'react';
import { GraphEditorLayout } from './GraphEditorLayout';
import { GraphEditorProvider, useGraphEditor } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';
import { ScreenReaderAnnouncerProvider } from './ScreenReaderAnnouncer';
import { LoadingSkeleton } from './LoadingSkeleton';
import { mindsAPI, relationshipsAPI } from '../../services/api';
import './GraphEditor.css';

/**
 * GraphEditorContent Component (internal)
 * Handles data fetching and displays the layout
 * Must be wrapped in GraphEditorProvider
 */
function GraphEditorContent() {
  const { state, dispatch } = useGraphEditor();
  
  useEffect(() => {
    // Fetch data on component mount
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        // Fetch minds and relationships in parallel
        const [minds, relationships] = await Promise.all([
          mindsAPI.list(),
          relationshipsAPI.list(),
        ]);
        
        // Update state with fetched data
        dispatch({ type: 'SET_MINDS', payload: minds });
        dispatch({ type: 'SET_RELATIONSHIPS', payload: relationships });
      } catch (error) {
        // Handle errors
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to fetch graph data';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        console.error('Error fetching graph data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    fetchData();
  }, [dispatch]);
  
  // Display loading state with skeleton screen
  if (state.loading) {
    return (
      <div className="graph-editor" role="main" aria-label="Graph Editor">
        <LoadingSkeleton />
      </div>
    );
  }
  
  // Display error state
  if (state.error) {
    return (
      <div className="graph-editor" role="main" aria-label="Graph Editor">
        <div className="error-container" role="alert" aria-live="assertive">
          <p className="error-message">Error: {state.error}</p>
          <button onClick={() => window.location.reload()} aria-label="Retry loading graph data">
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="graph-editor" role="main" aria-label="Graph Editor">
      <GraphEditorLayout />
    </div>
  );
}

/**
 * GraphEditor Component
 * Wraps GraphEditorContent with GraphEditorProvider, ToastProvider, and ScreenReaderAnnouncerProvider
 */
export function GraphEditor() {
  return (
    <GraphEditorProvider>
      <ToastProvider>
        <ScreenReaderAnnouncerProvider>
          <GraphEditorContent />
        </ScreenReaderAnnouncerProvider>
      </ToastProvider>
    </GraphEditorProvider>
  );
}
