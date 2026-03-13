/**
 * KeyboardShortcutsHelp Component
 * Modal displaying all available keyboard shortcuts
 * 
 * Features:
 * - Shows on ? key press
 * - Lists all available shortcuts with platform-specific keys (Ctrl/Cmd)
 * - Can be dismissed with ESC or close button
 * 
 * **Validates: Requirements 8.5, 18.6**
 */

import { useEffect } from 'react';
import './KeyboardShortcutsHelp.css';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  macKeys?: string;
  description: string;
}

/**
 * KeyboardShortcutsHelp Component
 * Displays a modal with all available keyboard shortcuts
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  // Detect if user is on Mac
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);

  // Define all available shortcuts
  const shortcuts: Shortcut[] = [
    {
      keys: 'Ctrl+Z',
      macKeys: 'Cmd+Z',
      description: 'Undo last action',
    },
    {
      keys: 'Ctrl+Shift+Z',
      macKeys: 'Cmd+Shift+Z',
      description: 'Redo last undone action',
    },
    {
      keys: 'Delete',
      description: 'Delete selected node or relationship',
    },
    {
      keys: 'Escape',
      description: 'Clear selection or close dialog',
    },
    {
      keys: '?',
      description: 'Show this help panel',
    },
  ];

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="keyboard-shortcuts-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div className="keyboard-shortcuts-content">
        <div className="keyboard-shortcuts-header">
          <h2 id="keyboard-shortcuts-title" className="keyboard-shortcuts-title">
            Keyboard Shortcuts
          </h2>
          <button
            className="keyboard-shortcuts-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        <div className="keyboard-shortcuts-body">
          <div className="shortcuts-list">
            {shortcuts.map((shortcut, index) => {
              // Use Mac keys if available and on Mac, otherwise use default keys
              const displayKeys = isMac && shortcut.macKeys ? shortcut.macKeys : shortcut.keys;
              
              return (
                <div key={index} className="shortcut-item">
                  <kbd className="shortcut-keys">{displayKeys}</kbd>
                  <span className="shortcut-description">{shortcut.description}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="keyboard-shortcuts-footer">
          <p className="keyboard-shortcuts-note">
            Press <kbd>?</kbd> anytime to show this help panel
          </p>
        </div>
      </div>
    </div>
  );
}
