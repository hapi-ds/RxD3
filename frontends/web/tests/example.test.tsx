import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Example test demonstrating the testing infrastructure is set up correctly
describe('Testing Infrastructure Example', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello Test</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('should work with React Router components', () => {
    const TestComponent = () => (
      <BrowserRouter>
        <div>Router Test</div>
      </BrowserRouter>
    );
    
    render(<TestComponent />);
    
    expect(screen.getByText('Router Test')).toBeInTheDocument();
  });
});
