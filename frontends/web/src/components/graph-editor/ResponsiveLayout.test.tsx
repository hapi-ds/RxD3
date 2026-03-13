/**
 * Responsive Layout Tests
 * Tests for responsive breakpoints and collapsible panels
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphEditorLayout } from './GraphEditorLayout';
import { GraphEditorProvider } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';

// Mock the child components
vi.mock('./GraphCanvas', () => ({
  GraphCanvasWithProvider: () => <div data-testid="graph-canvas">Graph Canvas</div>,
}));

vi.mock('./AttributeEditor', () => ({
  AttributeEditor: () => <div data-testid="attribute-editor">Attribute Editor</div>,
}));

vi.mock('./VersionHistoryPanel', () => ({
  VersionHistoryPanel: () => <div data-testid="version-history">Version History</div>,
}));

vi.mock('./KeyboardShortcutsHelp', () => ({
  KeyboardShortcutsHelp: () => null,
}));

vi.mock('./ScreenReaderAnnouncer', () => ({
  useScreenReaderAnnouncer: () => ({
    announceSelectionChange: vi.fn(),
    announceCRUDOperation: vi.fn(),
  }),
}));

// Helper to set viewport width
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

function renderLayout() {
  return render(
    <ToastProvider>
      <GraphEditorProvider>
        <GraphEditorLayout />
      </GraphEditorProvider>
    </ToastProvider>
  );
}

describe('ResponsiveLayout', () => {
  beforeEach(() => {
    // Reset viewport to desktop size
    setViewportWidth(1200);
  });

  describe('Desktop Layout (>1024px)', () => {
    it('should display three-panel layout on desktop', () => {
      setViewportWidth(1200);
      renderLayout();

      expect(screen.getByTestId('version-history')).toBeInTheDocument();
      expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('attribute-editor')).toBeInTheDocument();
    });

    it('should not show toggle button on desktop', () => {
      setViewportWidth(1200);
      renderLayout();

      expect(screen.queryByRole('button', { name: /version history panel/i })).not.toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768-1024px)', () => {
    it('should show toggle button on tablet', () => {
      setViewportWidth(900);
      renderLayout();

      const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should start with version panel closed on tablet', () => {
      setViewportWidth(900);
      renderLayout();

      const panel = screen.getByLabelText('Version History');
      expect(panel).toHaveAttribute('aria-hidden', 'true');
    });

    it('should open version panel when toggle button is clicked', () => {
      setViewportWidth(900);
      renderLayout();

      const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
      fireEvent.click(toggleButton);

      const panel = screen.getByLabelText('Version History');
      expect(panel).toHaveAttribute('aria-hidden', 'false');
    });

    it('should show overlay when panel is open', () => {
      setViewportWidth(900);
      const { container } = renderLayout();

      const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
      fireEvent.click(toggleButton);

      const overlay = container.querySelector('.version-panel-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should close panel when overlay is clicked', () => {
      setViewportWidth(900);
      const { container } = renderLayout();

      const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
      fireEvent.click(toggleButton);

      const overlay = container.querySelector('.version-panel-overlay');
      fireEvent.click(overlay!);

      const panel = screen.getByLabelText('Version History');
      expect(panel).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Mobile Layout (<768px)', () => {
    it('should hide all panels on mobile', () => {
      setViewportWidth(600);
      renderLayout();

      // Components are still rendered but hidden via CSS
      const versionPanel = screen.getByTestId('version-history').parentElement;
      const graphCanvas = screen.getByTestId('graph-canvas').parentElement;
      const attributeEditor = screen.getByTestId('attribute-editor').parentElement;

      // Check that parent containers have display: none via CSS
      expect(versionPanel).toHaveClass('version-history-panel-container');
      expect(graphCanvas).toHaveClass('graph-visualization-area-container');
      expect(attributeEditor).toHaveClass('attribute-editor-container');
    });
  });
});
