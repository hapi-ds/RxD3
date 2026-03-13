/**
 * NodeTypeSelectionModal Component Tests
 * 
 * Tests for the NodeTypeSelectionModal component with CreateNodeForm integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeTypeSelectionModal } from './NodeTypeSelectionModal';
import { NODE_TYPE_CONFIGS } from './nodeTypeConfig';
import { GraphEditorProvider } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';
import { mindsAPI } from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  mindsAPI: {
    create: vi.fn(),
  },
}));

// Helper to render component with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <GraphEditorProvider>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </GraphEditorProvider>
  );
}

describe('NodeTypeSelectionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={false} onClose={onClose} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Select Node Type')).toBeInTheDocument();
  });

  it('displays all 16 node types', () => {
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    const nodeTypes = Object.keys(NODE_TYPE_CONFIGS);
    expect(nodeTypes).toHaveLength(16);
    
    // Check that all node types are displayed by checking for buttons with aria-labels
    nodeTypes.forEach((type) => {
      const config = NODE_TYPE_CONFIGS[type as keyof typeof NODE_TYPE_CONFIGS];
      const button = screen.getByRole('button', { name: `Create ${config.label} node` });
      expect(button).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows CreateNodeForm when a node type is selected', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    // Click on Project node type
    const projectButton = screen.getByRole('button', { name: /create project node/i });
    await user.click(projectButton);
    
    // Should show the form instead of closing
    await waitFor(() => {
      // Check for form-specific elements
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/creator/i)).toBeInTheDocument();
    });
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('goes back to type selection when cancel is clicked in form', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    // Select a node type
    const projectButton = screen.getByRole('button', { name: /create project node/i });
    await user.click(projectButton);
    
    // Form should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });
    
    // Click cancel in form
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Should go back to type selection - check for node type grid
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create project node/i })).toBeInTheDocument();
    });
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    const backdrop = container.querySelector('.node-type-modal-backdrop');
    expect(backdrop).toBeInTheDocument();
    
    await user.click(backdrop!);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = renderWithProviders(<NodeTypeSelectionModal isOpen={true} onClose={onClose} />);
    
    const modalContent = container.querySelector('.node-type-modal-content');
    expect(modalContent).toBeInTheDocument();
    
    await user.click(modalContent!);
    
    expect(onClose).not.toHaveBeenCalled();
  });
});
