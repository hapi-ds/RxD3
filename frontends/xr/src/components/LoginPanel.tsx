/**
 * LoginPanel component for XR authentication
 * Provides a 3D login interface in virtual reality space
 * 
 * Features:
 * - 3D panel with text input fields
 * - Email and password inputs in 3D space
 * - Form submission calling useAuth().login
 * - Error message display
 * 
 * Requirements: 7.2
 */

import { useState } from 'react';
import { Html } from '@react-three/drei';
import { useAuth } from '../hooks/useAuth';

/**
 * LoginPanel component props
 */
interface LoginPanelProps {
  position?: [number, number, number];
  onLoginSuccess?: () => void;
}

/**
 * LoginPanel component for 3D authentication interface
 * 
 * Renders a 3D panel with HTML form elements for login
 * Uses Html component from @react-three/drei to embed 2D UI in 3D space
 * 
 * @param props - LoginPanel component props
 * @returns JSX element representing the login panel in 3D space
 * 
 * @example
 * ```tsx
 * <LoginPanel position={[0, 1.5, -2]} onLoginSuccess={() => console.log('Logged in')} />
 * ```
 */
export function LoginPanel({ position = [0, 1.5, -2], onLoginSuccess }: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  /**
   * Handle form submission
   * Calls useAuth().login and handles success/error states
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // Clear form on success
      setEmail('');
      setPassword('');
      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      // Display error message
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <group position={position}>
      {/* 3D panel background */}
      <mesh>
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial color="#1a1a2e" opacity={0.9} transparent />
      </mesh>

      {/* HTML form embedded in 3D space */}
      <Html
        transform
        occlude
        position={[0, 0, 0.01]}
        style={{
          width: '400px',
          padding: '20px',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px' }}>
            XR Login
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email input */}
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  backgroundColor: '#2a2a3e',
                  color: 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password input */}
            <div style={{ marginBottom: '15px' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  backgroundColor: '#2a2a3e',
                  color: 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#ff4444',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: isLoading ? '#555' : '#4CAF50',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#45a049';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#4CAF50';
                }
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </Html>
    </group>
  );
}
