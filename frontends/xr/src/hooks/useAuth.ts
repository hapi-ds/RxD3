/**
 * useAuth Hook
 * Custom React hook for managing authentication state
 * 
 * Features:
 * - Manages JWT token and authentication state
 * - Persists token in localStorage
 * - Provides login and logout functions
 * - Loads token from localStorage on mount
 * 
 * Requirements: 6.2, 6.3
 */

import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * Custom hook for authentication management
 * @returns AuthState object with token, isAuthenticated, login, and logout
 */
export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * Load token from localStorage on mount
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * Login function
   * Calls the backend API, stores token in localStorage, and updates state
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if login fails
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authAPI.login(email, password);
      const accessToken = response.access_token;
      
      // Store token in localStorage
      localStorage.setItem('token', accessToken);
      
      // Update state
      setToken(accessToken);
      setIsAuthenticated(true);
    } catch (error) {
      // Clear any existing token on failed login
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  /**
   * Logout function
   * Clears token from localStorage and updates state
   */
  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return {
    token,
    isAuthenticated,
    login,
    logout,
  };
}
