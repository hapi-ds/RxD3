/**
 * CreateNodeButton Component Tests
 * 
 * Tests for the CreateNodeButton component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateNodeButton } from './CreateNodeButton';

describe('CreateNodeButton', () => {
  it('renders the button', () => {
    render(<CreateNodeButton />);
    
    const button = screen.getByRole('button', { name: /create new node/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Create Node');
  });

  it('opens modal when clicked', async () => {
    const user = userEvent.setup();
    render(<CreateNodeButton />);
    
    const button = screen.getByRole('button', { name: /create new node/i });
    await user.click(button);
    
    // Check that modal is opened
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Select Node Type')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateNodeButton />);
    
    // Open modal
    const button = screen.getByRole('button', { name: /create new node/i });
    await user.click(button);
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    await user.click(closeButton);
    
    // Modal should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateNodeButton />);
    
    // Open modal
    const button = screen.getByRole('button', { name: /create new node/i });
    await user.click(button);
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
