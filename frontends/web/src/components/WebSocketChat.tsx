/**
 * WebSocketChat Component
 * Real-time chat interface using WebSocket connection
 * 
 * Features:
 * - Connection status indicator
 * - Message history display with sender and timestamp
 * - Message input and send functionality
 * - User join/leave event handling
 * 
 * Requirements: 6.5
 */

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import type { WSMessage } from '../types';

/**
 * WebSocketChat component for real-time messaging
 */
export function WebSocketChat() {
  const { token } = useAuth();
  const { isConnected, messages, sendMessage, connect, disconnect } = useWebSocket();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Connect to WebSocket when component mounts and token is available
   */
  useEffect(() => {
    if (token) {
      connect(token);
    }

    // Cleanup: disconnect on unmount
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle message form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (messageInput.trim() && isConnected) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Render a regular message
   */
  const renderMessage = (msg: WSMessage, index: number) => (
    <div key={index} className="message">
      <div className="message-header">
        <span className="message-sender">{msg.sender}</span>
        <span className="message-timestamp">{formatTimestamp(msg.timestamp)}</span>
      </div>
      <div className="message-content">{msg.content}</div>
    </div>
  );

  /**
   * Render a user event (joined/left)
   */
  const renderUserEvent = (msg: WSMessage, index: number) => (
    <div key={index} className="user-event">
      <span className="user-event-text">
        {msg.email} {msg.event === 'joined' ? 'joined' : 'left'} the chat
      </span>
      <span className="user-event-timestamp">{formatTimestamp(msg.timestamp)}</span>
    </div>
  );

  return (
    <div className="websocket-chat">
      <div className="chat-header">
        <h2>Real-Time Chat</h2>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) =>
            msg.type === 'message'
              ? renderMessage(msg, index)
              : renderUserEvent(msg, index)
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="message-input"
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!isConnected || !messageInput.trim()}
        >
          Send
        </button>
      </form>

      <style>{`
        .websocket-chat {
          display: flex;
          flex-direction: column;
          height: 600px;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        .chat-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .connection-status.connected {
          background: #d4edda;
          color: #155724;
        }

        .connection-status.disconnected {
          background: #f8d7da;
          color: #721c24;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .connection-status.connected .status-indicator {
          background: #28a745;
        }

        .connection-status.disconnected .status-indicator {
          background: #dc3545;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #fafafa;
        }

        .no-messages {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
        }

        .message {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .message-sender {
          font-weight: 600;
          color: #007bff;
          font-size: 0.875rem;
        }

        .message-timestamp {
          font-size: 0.75rem;
          color: #999;
        }

        .message-content {
          color: #333;
          line-height: 1.5;
        }

        .user-event {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: #e9ecef;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .user-event-text {
          color: #6c757d;
          font-style: italic;
        }

        .user-event-timestamp {
          font-size: 0.75rem;
          color: #999;
        }

        .message-form {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: #fff;
          border-top: 1px solid #ddd;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .message-input:focus {
          border-color: #007bff;
        }

        .message-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .send-button {
          padding: 0.75rem 1.5rem;
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
