# Components

## Login Component

The Login component provides user authentication interface for the FastAPI Neo4j Multi-Frontend System.

### Features

- Email and password input fields with validation
- Form submission handling with loading states
- Error message display for failed login attempts
- Automatic redirect on successful login via callback
- Accessible form elements with proper labels and ARIA attributes

### Usage

```tsx
import { Login } from './components/Login';

function App() {
  const handleLoginSuccess = () => {
    // Handle successful login (e.g., navigate to dashboard)
    console.log('User logged in successfully');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
```

### Props

- `onLoginSuccess?: () => void` - Optional callback function called after successful login

### Requirements

Validates **Requirement 6.2**: The Web_Frontend SHALL implement a login form that calls the Backend_Service /users/login endpoint

### Implementation Details

- Uses the `useAuth` hook for authentication state management
- Calls `authAPI.login` from the API service layer
- Stores JWT token in localStorage via the useAuth hook
- Displays user-friendly error messages on authentication failure
- Disables form inputs during submission to prevent duplicate requests
- Includes proper TypeScript types for type safety

### Styling

The component uses CSS modules (Login.css) for styling with:
- Responsive card layout
- Form validation states
- Loading states
- Error message styling
- Accessible focus states

### Testing

To test the Login component:

1. Start the backend server (ensure it's running on the configured API URL)
2. Start the web frontend: `npm run dev`
3. Navigate to http://localhost:3000
4. Enter valid credentials and verify successful login
5. Enter invalid credentials and verify error message display
