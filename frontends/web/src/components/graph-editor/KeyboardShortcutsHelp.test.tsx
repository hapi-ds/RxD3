/**
 * KeyboardShortcutsHelp Component Tests
 * 
 * Tests for the keyboard shortcuts help modal
 * 
 * **Validates: Requirements 8.5, 18.6**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

describe('KeyboardShortcutsHelp', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<KeyboardShortcutsHelp isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  describe('Shortcuts Display', () => {
    it('should display all keyboard shortcuts', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      // Check for shortcut descriptions
      expect(screen.getByText('Undo last action')).toBeInTheDocument();
      expect(screen.getByText('Redo last undone action')).toBeInTheDocument();
      expect(screen.getByText('Delete selected node or relationship')).toBeInTheDocument();
      expect(screen.getByText('Clear selection or close dialog')).toBeInTheDocument();
      expect(screen.getByText('Show this help panel')).toBeInTheDocument();
    });

    it('should display platform-specific shortcuts on non-Mac', () => {
      // Mock non-Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      // Should show Ctrl shortcuts
      expect(screen.getByText('Ctrl+Z')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Shift+Z')).toBeInTheDocument();
    });

    it('should display Mac-specific shortcuts on Mac', () => {
      // Mock Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      // Should show Cmd shortcuts
      expect(screen.getByText('Cmd+Z')).toBeInTheDocument();
      expect(screen.getByText('Cmd+Shift+Z')).toBeInTheDocument();
    });

    it('should display platform-independent shortcuts', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      // These shortcuts are the same on all platforms
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Escape')).toBeInTheDocument();
      
      // "?" appears twice (in shortcuts list and footer note)
      const questionMarks = screen.getAllByText('?');
      expect(questionMarks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close keyboard shortcuts help');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      const title = screen.getByText('Keyboard Shortcuts');
      fireEvent.click(title);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-shortcuts-title');
    });

    it('should have accessible close button', () => {
      render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close keyboard shortcuts help');
      expect(closeButton).toHaveAttribute('title', 'Close (Esc)');
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when modal is open', () => {
      const { rerender } = render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close modal
      rerender(<KeyboardShortcutsHelp isOpen={false} onClose={mockOnClose} />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });
});
