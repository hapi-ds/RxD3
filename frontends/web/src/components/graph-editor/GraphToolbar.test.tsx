/**
 * GraphToolbar Component Tests
 * 
 * Tests for the GraphToolbar component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphToolbar } from './GraphToolbar';
import { GraphEditorProvider } from './GraphEditorContext';

describe('GraphToolbar', () => {
  it('renders the toolbar', () => {
    render(
      <GraphEditorProvider>
        <GraphToolbar />
      </GraphEditorProvider>
    );
    
    // Check that the Create Node button is present
    const createButton = screen.getByRole('button', { name: /create new node/i });
    expect(createButton).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <GraphEditorProvider>
        <GraphToolbar className="custom-class" />
      </GraphEditorProvider>
    );
    
    const toolbar = container.querySelector('.graph-toolbar');
    expect(toolbar).toHaveClass('custom-class');
  });

  it('renders undo button', () => {
    render(
      <GraphEditorProvider>
        <GraphToolbar />
      </GraphEditorProvider>
    );
    
    const undoButton = screen.getByRole('button', { name: /undo last action/i });
    expect(undoButton).toBeInTheDocument();
  });

  it('renders redo button', () => {
    render(
      <GraphEditorProvider>
        <GraphToolbar />
      </GraphEditorProvider>
    );
    
    const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
    expect(redoButton).toBeInTheDocument();
  });

  it('renders create relationship button', () => {
    render(
      <GraphEditorProvider>
        <GraphToolbar />
      </GraphEditorProvider>
    );
    
    const createRelButton = screen.getByRole('button', { name: /create new relationship/i });
    expect(createRelButton).toBeInTheDocument();
  });

  it('renders toolbar separator', () => {
    const { container } = render(
      <GraphEditorProvider>
        <GraphToolbar />
      </GraphEditorProvider>
    );
    
    const separator = container.querySelector('.toolbar-separator');
    expect(separator).toBeInTheDocument();
  });
});
