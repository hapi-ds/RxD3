/**
 * Toast Component Tests
 * Tests for toast notification display and auto-dismiss functionality
 * 
 * **Validates: Requirements 4.9**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast, ToastContainer } from './Toast';
import type { ToastMessage } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays success toast with correct styling', () => {
    const toast: ToastMessage = {
      id: 'test-1',
      type: 'success',
      message: 'Operation successful',
    };
    const onDismiss = vi.fn();

    render(<Toast toast={toast} onDismiss={onDismiss} />);

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
    expect(screen.getByLabelText('Success notification')).toBeInTheDocument();
  });

  it('displays error toast with correct styling', () => {
    const toast: ToastMessage = {
      id: 'test-2',
      type: 'error',
      message: 'Operation failed',
    };
    const onDismiss = vi.fn();

    render(<Toast toast={toast} onDismiss={onDismiss} />);

    expect(screen.getByText('Operation failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-error');
    expect(screen.getByLabelText('Error notification')).toBeInTheDocument();
  });

  it('auto-dismisses after default duration (3000ms)', () => {
    const toast: ToastMessage = {
      id: 'test-3',
      type: 'success',
      message: 'Auto dismiss test',
    };
    const onDismiss = vi.fn();

    render(<Toast toast={toast} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    // Fast-forward time by 3000ms
    vi.advanceTimersByTime(3000);

    expect(onDismiss).toHaveBeenCalledWith('test-3');
  });

  it('auto-dismisses after custom duration', () => {
    const toast: ToastMessage = {
      id: 'test-4',
      type: 'success',
      message: 'Custom duration test',
      duration: 5000,
    };
    const onDismiss = vi.fn();

    render(<Toast toast={toast} onDismiss={onDismiss} />);

    // Should not dismiss after 3000ms
    vi.advanceTimersByTime(3000);
    expect(onDismiss).not.toHaveBeenCalled();

    // Should dismiss after 5000ms
    vi.advanceTimersByTime(2000);
    expect(onDismiss).toHaveBeenCalledWith('test-4');
  });

  it('dismisses when close button is clicked', () => {
    const toast: ToastMessage = {
      id: 'test-5',
      type: 'success',
      message: 'Manual dismiss test',
    };
    const onDismiss = vi.fn();

    render(<Toast toast={toast} onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss notification');
    dismissButton.click();

    expect(onDismiss).toHaveBeenCalledWith('test-5');
  });

  it('has accessible ARIA attributes', () => {
    const toast: ToastMessage = {
      id: 'test-6',
      type: 'success',
      message: 'Accessibility test',
    };
    const onDismiss = vi.fn();

    render(<Toast toast={toast} onDismiss={onDismiss} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveAttribute('aria-label', 'Success notification');
  });
});

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple toasts', () => {
    const toasts: ToastMessage[] = [
      { id: '1', type: 'success', message: 'First toast' },
      { id: '2', type: 'error', message: 'Second toast' },
      { id: '3', type: 'success', message: 'Third toast' },
    ];
    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();
  });

  it('has accessible ARIA attributes on container', () => {
    const toasts: ToastMessage[] = [
      { id: '1', type: 'success', message: 'Test toast' },
    ];
    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    const container = screen.getByText('Test toast').closest('.toast-container');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-atomic', 'false');
  });
});
