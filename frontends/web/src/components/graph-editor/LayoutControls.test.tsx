/**
 * LayoutControls Component Tests
 * 
 * Tests for layout algorithm selection and distance parameter controls
 * 
 * **Validates: Requirements 1.10, 1.11, 1.12, 1.13**
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LayoutControls } from './LayoutControls';
import { GraphEditorProvider } from './GraphEditorContext';

describe('LayoutControls', () => {
  it('renders layout algorithm dropdown', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('force-directed'); // Default value
  });

  it('renders all layout algorithm options', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm');
    const options = Array.from(select.querySelectorAll('option'));
    const optionValues = options.map(opt => opt.value);

    expect(optionValues).toContain('force-directed');
    expect(optionValues).toContain('hierarchical');
    expect(optionValues).toContain('circular');
    expect(optionValues).toContain('grid');
  });

  it('renders distance slider with correct range', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    const slider = screen.getByLabelText('Adjust node distance');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '0.5');
    expect(slider).toHaveAttribute('max', '2.0');
    expect(slider).toHaveAttribute('step', '0.1');
  });

  it('displays current distance value', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    // Default distance is 1.0
    expect(screen.getByText(/Node Distance: 1\.0/)).toBeInTheDocument();
  });

  it('updates algorithm when dropdown changes', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: 'hierarchical' } });
    
    expect(select.value).toBe('hierarchical');
  });

  it('updates distance when slider changes', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    const slider = screen.getByLabelText('Adjust node distance') as HTMLInputElement;
    
    fireEvent.change(slider, { target: { value: '1.5' } });
    
    expect(screen.getByText(/Node Distance: 1\.5/)).toBeInTheDocument();
  });

  it('has accessible ARIA labels', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    const select = screen.getByLabelText('Select layout algorithm');
    expect(select).toHaveAttribute('aria-label', 'Select layout algorithm');

    const slider = screen.getByLabelText('Adjust node distance');
    expect(slider).toHaveAttribute('aria-label', 'Adjust node distance');
    expect(slider).toHaveAttribute('aria-valuemin', '0.5');
    expect(slider).toHaveAttribute('aria-valuemax', '2'); // HTML converts 2.0 to 2
  });

  it('displays human-readable layout labels', () => {
    render(
      <GraphEditorProvider>
        <LayoutControls />
      </GraphEditorProvider>
    );

    expect(screen.getByText('Force-Directed')).toBeInTheDocument();
    expect(screen.getByText('Hierarchical')).toBeInTheDocument();
    expect(screen.getByText('Circular')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
  });
});
