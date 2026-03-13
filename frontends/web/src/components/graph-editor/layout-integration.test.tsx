/**
 * Layout Integration Tests
 * 
 * Tests for layout controls integration with GraphCanvas
 * 
 * **Validates: Requirements 1.11, 1.13, 1.14, 1.15**
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GraphEditorProvider, useGraphEditor } from './GraphEditorContext';
import { LayoutControls } from './LayoutControls';

// Test component that displays current layout state
function LayoutStateDisplay() {
  const { state } = useGraphEditor();
  return (
    <div>
      <div data-testid="current-algorithm">{state.layout.algorithm}</div>
      <div data-testid="current-distance">{state.layout.distance}</div>
    </div>
  );
}

describe('Layout Integration', () => {
  it('updates state when algorithm is changed', async () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
        <LayoutStateDisplay />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm') as HTMLSelectElement;
    
    // Initial state
    expect(screen.getByTestId('current-algorithm')).toHaveTextContent('force-directed');
    
    // Change algorithm
    fireEvent.change(select, { target: { value: 'hierarchical' } });
    
    // Verify state updated
    await waitFor(() => {
      expect(screen.getByTestId('current-algorithm')).toHaveTextContent('hierarchical');
    });
  });

  it('updates state when distance is changed', async () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
        <LayoutStateDisplay />
      </GraphEditorProvider>
    );

    const slider = screen.getByLabelText('Adjust node distance') as HTMLInputElement;
    
    // Initial state
    expect(screen.getByTestId('current-distance')).toHaveTextContent('1');
    
    // Change distance
    fireEvent.change(slider, { target: { value: '1.5' } });
    
    // Verify state updated
    await waitFor(() => {
      expect(screen.getByTestId('current-distance')).toHaveTextContent('1.5');
    });
  });

  it('maintains distance when algorithm changes', async () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
        <LayoutStateDisplay />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm') as HTMLSelectElement;
    const slider = screen.getByLabelText('Adjust node distance') as HTMLInputElement;
    
    // Set custom distance
    fireEvent.change(slider, { target: { value: '1.8' } });
    
    await waitFor(() => {
      expect(screen.getByTestId('current-distance')).toHaveTextContent('1.8');
    });
    
    // Change algorithm
    fireEvent.change(select, { target: { value: 'circular' } });
    
    // Verify distance is maintained
    await waitFor(() => {
      expect(screen.getByTestId('current-algorithm')).toHaveTextContent('circular');
      expect(screen.getByTestId('current-distance')).toHaveTextContent('1.8');
    });
  });

  it('allows switching between all layout algorithms', async () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
        <LayoutStateDisplay />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm') as HTMLSelectElement;
    const algorithms = ['force-directed', 'hierarchical', 'circular', 'grid'];
    
    for (const algorithm of algorithms) {
      fireEvent.change(select, { target: { value: algorithm } });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-algorithm')).toHaveTextContent(algorithm);
      });
    }
  });

  it('respects distance range constraints', async () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
        <LayoutStateDisplay />
      </GraphEditorProvider>
    );

    const slider = screen.getByLabelText('Adjust node distance') as HTMLInputElement;
    
    // Test minimum value
    fireEvent.change(slider, { target: { value: '0.5' } });
    await waitFor(() => {
      expect(screen.getByTestId('current-distance')).toHaveTextContent('0.5');
    });
    
    // Test maximum value
    fireEvent.change(slider, { target: { value: '2.0' } });
    await waitFor(() => {
      expect(screen.getByTestId('current-distance')).toHaveTextContent('2');
    });
    
    // Test middle value
    fireEvent.change(slider, { target: { value: '1.2' } });
    await waitFor(() => {
      expect(screen.getByTestId('current-distance')).toHaveTextContent('1.2');
    });
  });
});
