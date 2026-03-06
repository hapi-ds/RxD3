# Testing Infrastructure

This directory contains the test configuration and test files for the web frontend.

## Setup

The testing infrastructure uses:
- **Vitest**: Fast unit test framework powered by Vite
- **React Testing Library**: Testing utilities for React components
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **jsdom**: DOM implementation for Node.js

## Configuration

- `setup.ts`: Test setup file that runs before all tests
  - Configures React Testing Library cleanup
  - Imports jest-dom matchers for enhanced assertions

- `vite.config.ts`: Vitest configuration
  - Enables global test APIs
  - Sets jsdom as the test environment
  - Configures coverage reporting
  - Specifies setup file location

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Writing Tests

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyForm } from '../src/components/MyForm';

describe('MyForm', () => {
  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<MyForm />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test input');
    
    expect(input).toHaveValue('test input');
  });
});
```

### Testing with React Router

```typescript
import { BrowserRouter } from 'react-router-dom';

describe('Component with routing', () => {
  it('should work with router', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );
    // assertions...
  });
});
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the user sees and does
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Avoid testing internal state**: Test the component's output and behavior
4. **Keep tests simple**: One assertion per test when possible
5. **Use descriptive test names**: Clearly state what is being tested
6. **Mock external dependencies**: API calls, WebSocket connections, etc.

## Coverage

Run tests with coverage reporting:

```bash
npm run test:run -- --coverage
```

Coverage reports are generated in the `coverage/` directory.

Target: 80% coverage minimum
