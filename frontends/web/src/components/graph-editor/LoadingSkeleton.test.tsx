/**
 * LoadingSkeleton Component Tests
 * Tests for skeleton screen and spinner components
 * 
 * Requirements: 9.12
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton, Spinner } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders skeleton screen with proper ARIA attributes', () => {
    render(<LoadingSkeleton />);
    
    // Check for main container with ARIA attributes
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading graph editor');
  });

  it('renders all three panel skeletons', () => {
    render(<LoadingSkeleton />);
    
    // Check for version history skeleton
    expect(screen.getByLabelText('Loading version history')).toBeInTheDocument();
    
    // Check for graph visualization skeleton
    expect(screen.getByLabelText('Loading graph visualization')).toBeInTheDocument();
    
    // Check for attribute editor skeleton
    expect(screen.getByLabelText('Loading attribute editor')).toBeInTheDocument();
  });

  it('includes screen reader text', () => {
    render(<LoadingSkeleton />);
    
    // Check for screen reader only text
    expect(screen.getByText('Loading graph data, please wait...')).toBeInTheDocument();
  });

  it('renders skeleton nodes and edges in graph area', () => {
    const { container } = render(<LoadingSkeleton />);
    
    // Check for skeleton nodes
    const nodes = container.querySelectorAll('.skeleton-node');
    expect(nodes.length).toBeGreaterThan(0);
    
    // Check for skeleton edges
    const edges = container.querySelectorAll('.skeleton-edge');
    expect(edges.length).toBeGreaterThan(0);
  });
});

describe('Spinner', () => {
  it('renders spinner with default props', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-busy', 'true');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders spinner with custom label', () => {
    render(<Spinner label="Saving data" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Saving data');
    expect(screen.getByText('Saving data...')).toBeInTheDocument();
  });

  it('renders spinner with small size', () => {
    render(<Spinner size="small" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-small');
  });

  it('renders spinner with medium size', () => {
    render(<Spinner size="medium" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-medium');
  });

  it('renders spinner with large size', () => {
    render(<Spinner size="large" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-large');
  });

  it('includes screen reader text', () => {
    render(<Spinner label="Processing" />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
