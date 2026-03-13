/**
 * ToastContext Tests
 * Tests for toast notification context and provider
 * 
 * **Validates: Requirements 4.9**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

// Test component that uses the toast context
function TestComponent() {
  const { showSuccess, showError } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showSuccess('Custom duration', 5000)}>Show Custom</button>
    </div>
  );
}

describe('ToastContext', () => {
  it('throws error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleError.mockRestore();
  });

  it('provides toast functions through context', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeInTheDocument();
    expect(screen.getByText('Show Error')).toBeInTheDocument();
  });

  it('displays success toast when showSuccess is called', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = getByText('Show Success');
    
    act(() => {
      button.click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
  });

  it('displays error toast when showError is called', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = getByText('Show Error');
    
    act(() => {
      button.click();
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-error');
  });

  it('displays multiple toasts simultaneously', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      getByText('Show Success').click();
      getByText('Show Error').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('allows manual dismissal of toasts', () => {
    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      getByText('Show Success').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    const dismissButton = screen.getByLabelText('Dismiss notification');
    
    act(() => {
      dismissButton.click();
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('validates toast context provides required functions', () => {
    // **Validates: Requirements 4.9**
    // ToastContext should provide showSuccess and showError functions
    let contextValue: ReturnType<typeof useToast> | undefined;

    function CaptureContext() {
      contextValue = useToast();
      return null;
    }

    render(
      <ToastProvider>
        <CaptureContext />
      </ToastProvider>
    );

    expect(contextValue).toBeDefined();
    expect(contextValue?.showSuccess).toBeInstanceOf(Function);
    expect(contextValue?.showError).toBeInstanceOf(Function);
    expect(contextValue?.showToast).toBeInstanceOf(Function);
  });
});
