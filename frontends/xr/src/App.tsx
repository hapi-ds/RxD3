/**
 * App Component - Root XR Application
 * 
 * Integrates all XR components:
 * - Scene with 3D environment
 * - Avatar rendering for connected users
 * - LoginPanel for authentication
 * - WebSocket connection management
 * 
 * Requirements: 7.1, 7.3, 7.5
 */

import { useEffect, useState } from 'react';
import { Avatar } from './components/Avatar';
import { LoginPanel } from './components/LoginPanel';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import type { WSMessage } from './types';

/**
 * Connected user data extracted from WebSocket messages
 */
interface ConnectedUser {
  email: string;
  position?: [number, number, number];
}

/**
 * Extract unique connected users from WebSocket messages
 * Filters for user_event messages with 'joined' events
 * @param messages - Array of WebSocket messages
 * @returns Array of unique connected users
 */
function extractConnectedUsers(messages: WSMessage[]): ConnectedUser[] {
  const userMap = new Map<string, ConnectedUser>();
  
  messages.forEach((msg) => {
    if (msg.type === 'user_event' && msg.email) {
      if (msg.event === 'joined') {
        // Add user to the map
        userMap.set(msg.email, {
          email: msg.email,
          position: undefined, // Position can be enhanced later with actual user positions
        });
      } else if (msg.event === 'left') {
        // Remove user from the map
        userMap.delete(msg.email);
      }
    }
    
    // Also track users who send messages
    if (msg.type === 'message' && msg.sender) {
      if (!userMap.has(msg.sender)) {
        userMap.set(msg.sender, {
          email: msg.sender,
          position: undefined,
        });
      }
    }
  });
  
  return Array.from(userMap.values());
}

/**
 * Generate positions for avatars in a circle around the origin
 * @param users - Array of connected users
 * @returns Array of users with assigned positions
 */
function assignAvatarPositions(users: ConnectedUser[]): ConnectedUser[] {
  const radius = 3; // Distance from center
  const angleStep = (2 * Math.PI) / Math.max(users.length, 1);
  
  return users.map((user, index) => {
    const angle = index * angleStep;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    return {
      ...user,
      position: [x, 1, z] as [number, number, number],
    };
  });
}

/**
 * Main App Component
 * 
 * Manages authentication state and WebSocket connection
 * Renders either LoginPanel or Scene based on authentication status
 * 
 * @returns JSX element representing the XR application
 */
export default function App() {
  const { isAuthenticated, token } = useAuth();
  const { isConnected, messages, connect, disconnect } = useWebSocket();
  const [showLogin, setShowLogin] = useState(true);

  // Create XR store for WebXR session management
  const store = createXRStore();

  /**
   * Connect to WebSocket when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token);
      setShowLogin(false);
    } else {
      disconnect();
      setShowLogin(true);
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  /**
   * Extract and position connected users from WebSocket messages
   */
  const connectedUsers = assignAvatarPositions(extractConnectedUsers(messages));

  /**
   * Handle successful login
   */
  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      {/* Connection status indicator */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: isConnected ? '#4CAF50' : '#f44336',
          color: 'white',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* User count indicator */}
      {isAuthenticated && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '10px',
            zIndex: 1000,
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '4px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
          }}
        >
          👥 Users: {connectedUsers.length}
        </div>
      )}

      {/* VR Enter Button */}
      <button
        onClick={() => store.enterVR()}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '15px 30px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Enter VR
      </button>

      {/* 3D Scene */}
      <Canvas>
        <XR store={store}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="green" />
          </mesh>

          {/* Show LoginPanel if not authenticated */}
          {showLogin && <LoginPanel onLoginSuccess={handleLoginSuccess} />}

          {/* Render avatars for connected users when authenticated */}
          {isAuthenticated &&
            connectedUsers.map((user) => (
              <Avatar key={user.email} user={user} />
            ))}
        </XR>
      </Canvas>
    </div>
  );
}
