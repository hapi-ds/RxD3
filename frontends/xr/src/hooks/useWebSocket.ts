/**
 * Custom React hook for managing WebSocket connections
 * Handles authentication, message sending/receiving, and automatic reconnection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { wsUrl } from '../config';
import type { WSMessage } from '../types';

/**
 * WebSocket hook state and methods
 */
interface UseWebSocketReturn {
  isConnected: boolean;
  messages: WSMessage[];
  sendMessage: (content: string) => void;
  connect: (token: string) => void;
  disconnect: () => void;
}

/**
 * Custom hook for WebSocket connection management
 * 
 * Features:
 * - JWT token authentication via query parameter
 * - Connection status tracking
 * - Message history management
 * - Automatic reconnection on unexpected disconnects
 * - Clean disconnect handling
 * 
 * @returns WebSocket state and control methods
 * 
 * @example
 * ```tsx
 * const { isConnected, messages, sendMessage, connect, disconnect } = useWebSocket();
 * 
 * // Connect with JWT token
 * useEffect(() => {
 *   const token = localStorage.getItem('token');
 *   if (token) {
 *     connect(token);
 *   }
 *   return () => disconnect();
 * }, []);
 * 
 * // Send a message
 * sendMessage('Hello, world!');
 * ```
 */
export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  
  // Use refs to maintain WebSocket instance and token across renders
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalDisconnectRef = useRef(false);

  /**
   * Connect to WebSocket server with JWT authentication
   * @param token - JWT token for authentication
   */
  const connect = useCallback((token: string) => {
    // Store token for reconnection attempts
    tokenRef.current = token;
    intentionalDisconnectRef.current = false;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Create WebSocket connection with token as query parameter
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;

      /**
       * Handle successful connection
       */
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      /**
       * Handle incoming messages
       */
      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      /**
       * Handle connection errors
       */
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      /**
       * Handle connection close
       * Implements automatic reconnection for unexpected disconnects
       */
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Only attempt reconnection if:
        // 1. Not an intentional disconnect
        // 2. Not a 403 (authentication failure)
        // 3. We have a token to reconnect with
        if (
          !intentionalDisconnectRef.current &&
          event.code !== 403 &&
          tokenRef.current
        ) {
          console.log('Attempting to reconnect in 5 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (tokenRef.current) {
              connect(tokenRef.current);
            }
          }, 5000);
        }

        // If authentication failed (403), clear the token
        if (event.code === 403) {
          console.error('WebSocket authentication failed');
          tokenRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, []);

  /**
   * Send a message through the WebSocket connection
   * @param content - Message content to send
   */
  const sendMessage = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        content,
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  /**
   * Disconnect from WebSocket server
   * Prevents automatic reconnection
   */
  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    tokenRef.current = null;

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Cleanup on component unmount
   */
  useEffect(() => {
    return () => {
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close WebSocket connection
      if (wsRef.current) {
        intentionalDisconnectRef.current = true;
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect,
  };
}
