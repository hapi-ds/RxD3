/**
 * Toast Component
 * Displays temporary notification messages (success/error)
 * 
 * Features:
 * - Auto-dismiss after configurable duration
 * - Success and error variants
 * - Accessible with ARIA attributes
 * - Stacked display for multiple toasts
 * 
 * **Validates: Requirements 4.9**
 */

import { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // milliseconds, default 3000
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

/**
 * Individual Toast Component
 * Displays a single toast notification with auto-dismiss
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const handleDismiss = () => {
    onDismiss(toast.id);
  };

  const icon = toast.type === 'success' ? '✓' : '✕';
  const ariaLabel = toast.type === 'success' ? 'Success notification' : 'Error notification';

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="alert"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <span className="toast-icon">{icon}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

/**
 * ToastContainer Component
 * Manages and displays multiple toast notifications
 */
interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
