/**
 * Mock ScreenReaderAnnouncer for tests
 * Provides no-op implementations for tests that don't need announcement functionality
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface AnnouncerContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceFilterChange: (filterType: string, details: string) => void;
  announceSelectionChange: (type: 'node' | 'edge' | 'none', title?: string) => void;
  announceCRUDOperation: (operation: 'created' | 'updated' | 'deleted', entityType: 'node' | 'relationship', title?: string) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue>({
  announce: () => {},
  announceFilterChange: () => {},
  announceSelectionChange: () => {},
  announceCRUDOperation: () => {},
});

export function ScreenReaderAnnouncerProvider({ children }: { children: ReactNode }) {
  const value: AnnouncerContextValue = {
    announce: () => {},
    announceFilterChange: () => {},
    announceSelectionChange: () => {},
    announceCRUDOperation: () => {},
  };

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
    </AnnouncerContext.Provider>
  );
}

export function useScreenReaderAnnouncer(): AnnouncerContextValue {
  return useContext(AnnouncerContext);
}
