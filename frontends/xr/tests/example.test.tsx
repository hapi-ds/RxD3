import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Example test demonstrating the testing infrastructure is set up correctly
describe('Testing Infrastructure Example', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello Test</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});
