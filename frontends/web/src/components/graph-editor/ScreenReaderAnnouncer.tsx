/**
 * ScreenReaderAnnouncer Component
 * Provides screen reader announcements for state changes using ARIA live regions
 * 
 * Features:
 * - Announces filter changes (node type, text search, focus mode, reset)
 * - Announces selection changes (node selected/deselected, edge selected/deselected)
 * - Announces CRUD operation results (create, update, delete)
 * - Uses aria-live="polite" for non-critical updates
 * - Uses aria-live="assertive" for errors/critical updates
 * - Debounces rapid changes to avoid announcement spam
 * 
 * **Validates: Requirements 9.8**
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import './ScreenReaderAnnouncer.css';

interface AnnouncerContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceFilterChange: (filterType: string, details: string) => void;
  announceSelectionChange: (type: 'node' | 'edge' | 'none', title?: string) => void;
  announceCRUDOperation: (operation: 'created' | 'updated' | 'deleted', entityType: 'node' | 'relationship', title?: string) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | undefined>(undefined);

/**
 * ScreenReaderAnnouncerProvider Component
 * Provides screen reader announcement functionality throughout the application
 */
export function ScreenReaderAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnouncementRef = useRef<string>('');

  /**
   * Generic announce function
   * Debounces rapid announcements to avoid spam
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Skip if message is identical to last announcement (within 1 second)
    if (message === lastAnnouncementRef.current) {
      return;
    }

    lastAnnouncementRef.current = message;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to announce after 150ms (debounce rapid changes)
    debounceTimerRef.current = setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveMessage(message);
        // Clear after announcement is made
        setTimeout(() => setAssertiveMessage(''), 100);
      } else {
        setPoliteMessage(message);
        // Clear after announcement is made
        setTimeout(() => setPoliteMessage(''), 100);
      }
    }, 150);
  }, []);

  /**
   * Announce filter changes
   * Examples:
   * - "Node type filter applied: Project, Task"
   * - "Text search applied: meeting"
   * - "Focus mode activated on Project Alpha"
   * - "All filters reset"
   */
  const announceFilterChange = useCallback((filterType: string, details: string) => {
    const message = `${filterType}: ${details}`;
    announce(message, 'polite');
  }, [announce]);

  /**
   * Announce selection changes
   * Examples:
   * - "Node selected: Project Alpha"
   * - "Edge selected: depends_on relationship"
   * - "Selection cleared"
   */
  const announceSelectionChange = useCallback((type: 'node' | 'edge' | 'none', title?: string) => {
    let message = '';
    
    if (type === 'none') {
      message = 'Selection cleared';
    } else if (type === 'node') {
      message = `Node selected: ${title || 'Unknown'}`;
    } else if (type === 'edge') {
      message = `Edge selected: ${title || 'Unknown relationship'}`;
    }
    
    announce(message, 'polite');
  }, [announce]);

  /**
   * Announce CRUD operation results
   * Examples:
   * - "Node created: New Task"
   * - "Node updated: Project Alpha"
   * - "Node deleted: Old Task"
   * - "Relationship created"
   * - "Relationship deleted"
   */
  const announceCRUDOperation = useCallback((
    operation: 'created' | 'updated' | 'deleted',
    entityType: 'node' | 'relationship',
    title?: string
  ) => {
    const entityName = entityType === 'node' ? 'Node' : 'Relationship';
    const titlePart = title ? `: ${title}` : '';
    const message = `${entityName} ${operation}${titlePart}`;
    
    // Use assertive for deletions, polite for creates/updates
    const priority = operation === 'deleted' ? 'assertive' : 'polite';
    announce(message, priority);
  }, [announce]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const value: AnnouncerContextValue = {
    announce,
    announceFilterChange,
    announceSelectionChange,
    announceCRUDOperation,
  };

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      {/* ARIA live regions for screen reader announcements */}
      <div className="screen-reader-announcer">
        {/* Polite announcements - non-critical updates */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {politeMessage}
        </div>
        {/* Assertive announcements - critical updates/errors */}
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          {assertiveMessage}
        </div>
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * useScreenReaderAnnouncer Hook
 * Access screen reader announcement functions from any component
 */
export function useScreenReaderAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useScreenReaderAnnouncer must be used within a ScreenReaderAnnouncerProvider');
  }
  return context;
}
