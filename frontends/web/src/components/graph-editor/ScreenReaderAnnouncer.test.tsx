/**
 * ScreenReaderAnnouncer Component Tests
 * Tests for screen reader announcement functionality
 * 
 * **Validates: Requirements 9.8**
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ScreenReaderAnnouncerProvider, useScreenReaderAnnouncer } from './ScreenReaderAnnouncer';

describe('ScreenReaderAnnouncer', () => {
  // Test component that uses the announcer
  function TestComponent() {
    const { announce, announceFilterChange, announceSelectionChange, announceCRUDOperation } = useScreenReaderAnnouncer();

    return (
      <div>
        <button onClick={() => announce('Test message', 'polite')}>Announce Polite</button>
        <button onClick={() => announce('Critical message', 'assertive')}>Announce Assertive</button>
        <button onClick={() => announceFilterChange('Node type filter', 'Project added')}>Filter Change</button>
        <button onClick={() => announceSelectionChange('node', 'Test Node')}>Select Node</button>
        <button onClick={() => announceCRUDOperation('created', 'node', 'New Node')}>Create Node</button>
      </div>
    );
  }

  it('renders live regions with correct ARIA attributes', () => {
    render(
      <ScreenReaderAnnouncerProvider>
        <TestComponent />
      </ScreenReaderAnnouncerProvider>
    );

    // Check for polite live region
    const politeRegion = document.querySelector('[aria-live="polite"]');
    expect(politeRegion).toBeTruthy();
    expect(politeRegion?.getAttribute('role')).toBe('status');
    expect(politeRegion?.getAttribute('aria-atomic')).toBe('true');

    // Check for assertive live region
    const assertiveRegion = document.querySelector('[aria-live="assertive"]');
    expect(assertiveRegion).toBeTruthy();
    expect(assertiveRegion?.getAttribute('role')).toBe('alert');
    expect(assertiveRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('announces polite messages', async () => {
    render(
      <ScreenReaderAnnouncerProvider>
        <TestComponent />
      </ScreenReaderAnnouncerProvider>
    );

    const button = screen.getByText('Announce Polite');
    button.click();

    await waitFor(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Test message');
    });
  });

  it('announces assertive messages', async () => {
    render(
      <ScreenReaderAnnouncerProvider>
        <TestComponent />
      </ScreenReaderAnnouncerProvider>
    );

    const button = screen.getByText('Announce Assertive');
    button.click();

    await waitFor(() => {
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion?.textContent).toBe('Critical message');
    });
  });

  it('announces filter changes', async () => {
    render(
      <ScreenReaderAnnouncerProvider>
        <TestComponent />
      </ScreenReaderAnnouncerProvider>
    );

    const button = screen.getByText('Filter Change');
    button.click();

    await waitFor(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Node type filter: Project added');
    });
  });

  it('announces selection changes', async () => {
    render(
      <ScreenReaderAnnouncerProvider>
        <TestComponent />
      </ScreenReaderAnnouncerProvider>
    );

    const button = screen.getByText('Select Node');
    button.click();

    await waitFor(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Node selected: Test Node');
    });
  });

  it('announces CRUD operations', async () => {
    render(
      <ScreenReaderAnnouncerProvider>
        <TestComponent />
      </ScreenReaderAnnouncerProvider>
    );

    const button = screen.getByText('Create Node');
    button.click();

    await waitFor(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion?.textContent).toBe('Node created: New Node');
    });
  });

  it('throws error when used outside provider', () => {
    function InvalidComponent() {
      useScreenReaderAnnouncer();
      return null;
    }

    expect(() => render(<InvalidComponent />)).toThrow(
      'useScreenReaderAnnouncer must be used within a ScreenReaderAnnouncerProvider'
    );
  });
});
