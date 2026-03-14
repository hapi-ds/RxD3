/**
 * ConfirmToolCallDialog Component
 * Confirmation dialog for AI-suggested graph modifications
 * 
 * Features:
 * - Modal backdrop with click-to-close
 * - Escape key to cancel
 * - Displays tool name and all arguments
 * - Follows existing ConfirmDialog pattern
 */

import { useEffect } from 'react';
import type { ToolCall } from '../../types/chat';
import './ConfirmToolCallDialog.css';

export interface ConfirmToolCallDialogProps {
  toolCall: ToolCall;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmToolCallDialog Component
 * Displays a confirmation dialog for AI-suggested tool calls
 */
export function ConfirmToolCallDialog({
  toolCall,
  onConfirm,
  onCancel,
}: ConfirmToolCallDialogProps) {
  // Handle escape key to cancel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  // Format tool name for display
  const formatToolName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format argument key for display
  const formatArgKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format argument value for display
  const formatArgValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div
      className="confirm-tool-call-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-tool-call-title"
      aria-describedby="confirm-tool-call-description"
    >
      <div className="confirm-tool-call-content">
        <div className="confirm-tool-call-header">
          <h2 id="confirm-tool-call-title" className="confirm-tool-call-title">
            Confirm AI Suggestion
          </h2>
        </div>

        <div className="confirm-tool-call-body">
          <p id="confirm-tool-call-description" className="confirm-tool-call-description">
            The AI assistant suggests the following action:
          </p>

          <div className="tool-call-details">
            <div className="tool-call-name">
              <strong>Action:</strong> {formatToolName(toolCall.tool_name)}
            </div>

            <div className="tool-call-arguments">
              <strong>Details:</strong>
              <dl className="arguments-list">
                {Object.entries(toolCall.arguments).map(([key, value]) => (
                  <div key={key} className="argument-item">
                    <dt className="argument-key">{formatArgKey(key)}:</dt>
                    <dd className="argument-value">{formatArgValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="confirm-tool-call-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
