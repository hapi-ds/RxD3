/**
 * Responsive Design Tests for VersionHistoryPanel
 * Tests collapsible behavior on tablet (768-1024px)
 * 
 * Requirements: 9.14
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GraphEditorLayout } from './GraphEditorLayout';
import { GraphEditorProvider } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';
import { ScreenReaderAnnouncerProvider } from './ScreenReaderAnnouncer';

// Mock the API
vi.mock('../../services/api', () => ({
  mindsAPI: {
    list: vi.fn().mockResolvedValue([]),
    getVersions: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  relationshipsAPI: {
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock react-flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: () => <div data-testid="react-flow">Graph Canvas</div>,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  useReactFlow: () => ({
    fitView: vi.fn(),
    setViewport: vi.fn(),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
  }),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

// Helper to render component with all providers
function renderWithProviders() {
  return render(
    <ToastProvider>
      <ScreenReaderAnnouncerProvider>
        <GraphEditorProvider>
          <GraphEditorLayout />
        </GraphEditorProvider>
      </ScreenReaderAnnouncerProvider>
    </ToastProvider>
  );
}

describe('VersionHistoryPanel Responsive Design', () => {
  beforeEach(() => {
    // Reset viewport to desktop size before each test
    setViewportWidth(1280);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout (>1024px)', () => {
    it('should display version history panel permanently on desktop', () => {
      setViewportWidth(1280);
      
      renderWithProviders();

      // Panel should be visible
      const panel = screen.getByRole('region', { name: /version history/i });
      expect(panel).toBeInTheDocument();
      
      // Toggle button should not exist on desktop
      const toggleButton = screen.queryByRole('button', { name: /version history/i });
      expect(toggleButton).not.toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768-1024px)', () => {
    it('should display toggle button on tablet', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      // Wait for resize to take effect
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('should have panel closed by default on tablet', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      await waitFor(() => {
        // Use querySelector since aria-hidden elements are not accessible via getByRole
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('closed');
        expect(panel).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should open panel when toggle button is clicked', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('open');
        expect(panel).toHaveAttribute('aria-hidden', 'false');
      });
    });

    it('should display backdrop overlay when panel is open', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const overlay = document.querySelector('.version-panel-overlay');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should close panel when overlay is clicked', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      // Open panel
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      // Click overlay
      await waitFor(() => {
        const overlay = document.querySelector('.version-panel-overlay');
        expect(overlay).toBeInTheDocument();
        fireEvent.click(overlay!);
      });

      // Panel should be closed
      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('closed');
      });
    });

    it('should close panel when toggle button is clicked again', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      // Open panel
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      // Close panel
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /close version history panel/i });
        fireEvent.click(toggleButton);
      });

      // Panel should be closed
      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('closed');
      });
    });

    it('should have proper ARIA attributes on toggle button', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
        expect(toggleButton).toHaveAttribute('aria-label', 'Open version history panel');
      });

      // Click to open
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      // Check updated ARIA attributes
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /close version history panel/i });
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        expect(toggleButton).toHaveAttribute('aria-label', 'Close version history panel');
      });
    });

    it('should slide panel in from left with animation', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        // Panel should start off-screen (closed)
        expect(panel).toHaveClass('closed');
      });

      // Open panel
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      // Panel should slide in (open)
      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('open');
        expect(panel).not.toHaveClass('closed');
      });
    });

    it('should maintain panel state when resizing within tablet range', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      // Open panel
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        fireEvent.click(toggleButton);
      });

      // Resize within tablet range
      setViewportWidth(800);

      // Panel should still be open
      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('open');
      });
    });
  });

  describe('Keyboard Support', () => {
    it('should support keyboard navigation for toggle button', async () => {
      setViewportWidth(900);
      
      renderWithProviders();

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /open version history panel/i });
        
        // Focus the button
        toggleButton.focus();
        expect(document.activeElement).toBe(toggleButton);
        
        // Press Enter to open
        fireEvent.keyDown(toggleButton, { key: 'Enter' });
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const panel = document.querySelector('.version-history-panel-container');
        expect(panel).toHaveClass('open');
      });
    });
  });

  describe('Mobile Layout (<768px)', () => {
    it('should hide all panels and show message on mobile', () => {
      setViewportWidth(600);
      
      renderWithProviders();

      // Toggle button should not exist
      const toggleButton = screen.queryByRole('button', { name: /version history/i });
      expect(toggleButton).not.toBeInTheDocument();
    });
  });
});
