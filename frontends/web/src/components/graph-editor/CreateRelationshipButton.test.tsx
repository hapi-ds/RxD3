/**
 * CreateRelationshipButton Component Tests
 * Tests for the relationship creation button and modal
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRelationshipButton } from './CreateRelationshipButton';
import { GraphEditorProvider } from './GraphEditorContext';
import { ToastProvider } from './ToastContext';

// Mock the API
vi.mock('../../services/api', () => ({
  relationshipsAPI: {
    create: vi.fn(),
  },
}));

describe('CreateRelationshipButton', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ToastProvider>
        <GraphEditorProvider>
          {component}
        </GraphEditorProvider>
      </ToastProvider>
    );
  };

  it('renders the create relationship button', () => {
    renderWithProviders(<CreateRelationshipButton />);
    
    const button = screen.getByRole('button', { name: /create new relationship/i });
    expect(button).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateRelationshipButton />);
    
    const button = screen.getByRole('button', { name: /create new relationship/i });
    await user.click(button);
    
    // Modal should be visible - check for modal header
    expect(screen.getByRole('heading', { name: /create relationship/i })).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateRelationshipButton />);
    
    // Open modal
    const button = screen.getByRole('button', { name: /create new relationship/i });
    await user.click(button);
    
    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Modal should be closed - check that modal header is gone
    expect(screen.queryByRole('heading', { name: /create relationship/i })).not.toBeInTheDocument();
  });
});
