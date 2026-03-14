/**
 * ChatPanel Component
 * Main chat interface for AI assistant integration
 * 
 * Features:
 * - Message history with auto-scroll
 * - Streaming response handling
 * - Error handling with retry
 * - Tool call confirmation flow
 * - Debounced message submission
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatAPI, mindsAPI, relationshipsAPI } from '../../services/api';
import type { ChatMessage as ChatMessageType, ChatStreamEvent, ToolCall, SuggestionLogEntry } from '../../types/chat';
import type { Mind } from '../../types/generated';
import { ChatMessage } from './ChatMessage';
import { ConfirmToolCallDialog } from './ConfirmToolCallDialog';
import './ChatPanel.css';

interface ChatPanelState {
  messages: ChatMessageType[];
  inputValue: string;
  isLoading: boolean;
  error: string | null;
  pendingToolCall: ToolCall | null;
  suggestionLog: SuggestionLogEntry[];
}

export function ChatPanel() {
  const { logout } = useAuth();
  const [state, setState] = useState<ChatPanelState>({
    messages: [],
    inputValue: '',
    isLoading: false,
    error: null,
    pendingToolCall: null,
    suggestionLog: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (messageContent?: string) => {
    const content = messageContent || state.inputValue.trim();
    
    if (!content || state.isLoading) {
      return;
    }

    // Clear debounce timer if exists
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Add user message to history
    const userMessage: ChatMessageType = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputValue: '',
      isLoading: true,
      error: null,
    }));

    try {
      // Call chat API with streaming
      const stream = await chatAPI.sendMessage(content, state.messages);
      const reader = stream.getReader();

      // Initialize assistant message
      let assistantContent = '';
      const assistantMessage: ChatMessageType = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Read stream events
      let result;
      while (!(result = await reader.read()).done) {
        const event: ChatStreamEvent = result.value;

        switch (event.type) {
          case 'message_chunk':
            if (event.content) {
              assistantContent += event.content;
              setState(prev => ({
                ...prev,
                messages: prev.messages.map((msg, idx) =>
                  idx === prev.messages.length - 1
                    ? { ...msg, content: assistantContent }
                    : msg
                ),
              }));
            }
            break;

          case 'function_call':
            if (event.tool_name && event.arguments) {
              setState(prev => ({
                ...prev,
                pendingToolCall: {
                  tool_name: event.tool_name!,
                  arguments: event.arguments!,
                },
              }));
            }
            break;

          case 'error':
            setState(prev => ({
              ...prev,
              error: event.error_message || 'An error occurred',
              isLoading: false,
            }));
            
            // Add error as system message
            const errorMessage: ChatMessageType = {
              role: 'system',
              content: `Error: ${event.error_message || 'An error occurred'}`,
              timestamp: new Date().toISOString(),
            };
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, errorMessage],
            }));
            return;

          case 'done':
            setState(prev => ({
              ...prev,
              isLoading: false,
            }));
            break;
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
      }));

    } catch (error: any) {
      console.error('Chat error:', error);

      // Handle 401 errors by logging out
      if (error.message?.includes('401') || error.message?.includes('Not authenticated')) {
        logout();
        return;
      }

      // Determine error message based on error type
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message?.includes('503')) {
        errorMessage = 'AI provider is currently unavailable. Please try again later.';
      } else if (error.message?.includes('504')) {
        errorMessage = 'Request timed out. Please try a shorter message.';
      } else if (error.message?.includes('not configured')) {
        errorMessage = 'AI provider is not configured. Please contact your administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      // Add error as system message
      const errorMsg: ChatMessageType = {
        role: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
      }));
    }
  }, [state.inputValue, state.isLoading, state.messages, logout]);

  // Handle confirming a tool call
  const handleConfirmToolCall = useCallback(async () => {
    if (!state.pendingToolCall) {
      return;
    }

    const toolCall = state.pendingToolCall;

    try {
      // Log confirmation
      const logEntry: SuggestionLogEntry = {
        timestamp: new Date().toISOString(),
        tool_call: toolCall,
        action: 'confirmed',
      };

      setState(prev => ({
        ...prev,
        suggestionLog: [...prev.suggestionLog, logEntry],
        pendingToolCall: null,
        isLoading: true,
      }));

      // Execute the tool call
      if (toolCall.tool_name === 'create_mind_node') {
        const { mind_type, title, description, status } = toolCall.arguments;
        
        // Build the create payload - backend expects fields without __primarylabel__
        const createPayload: Record<string, unknown> = {
          mind_type: mind_type as string,
          title: title as string,
        };
        
        if (description) {
          createPayload.description = description as string;
        }
        
        if (status) {
          createPayload.status = status as string;
        }
        
        await mindsAPI.create(createPayload as Omit<Mind, 'uuid' | 'version' | 'created_at' | 'updated_at'>);

        // Add success message
        const successMessage: ChatMessageType = {
          role: 'system',
          content: `✓ Successfully created ${mind_type} node: "${title}"`,
          timestamp: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, successMessage],
          isLoading: false,
        }));

        // Trigger graph refresh (emit custom event)
        window.dispatchEvent(new CustomEvent('graph-refresh'));

      } else if (toolCall.tool_name === 'create_relationship') {
        const { source_uuid, target_uuid, relationship_type } = toolCall.arguments;
        await relationshipsAPI.create({
          source: source_uuid as string,
          target: target_uuid as string,
          type: (relationship_type as string).toUpperCase() as any,
          properties: {},
        });

        // Add success message
        const successMessage: ChatMessageType = {
          role: 'system',
          content: `✓ Successfully created ${relationship_type} relationship`,
          timestamp: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, successMessage],
          isLoading: false,
        }));

        // Trigger graph refresh
        window.dispatchEvent(new CustomEvent('graph-refresh'));
      }

    } catch (error: any) {
      console.error('Tool call execution error:', error);

      const errorMessage: ChatMessageType = {
        role: 'system',
        content: `✗ Failed to execute action: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  }, [state.pendingToolCall]);

  // Handle canceling a tool call
  const handleCancelToolCall = useCallback(() => {
    if (!state.pendingToolCall) {
      return;
    }

    // Log rejection
    const logEntry: SuggestionLogEntry = {
      timestamp: new Date().toISOString(),
      tool_call: state.pendingToolCall,
      action: 'rejected',
    };

    setState(prev => ({
      ...prev,
      suggestionLog: [...prev.suggestionLog, logEntry],
      pendingToolCall: null,
    }));

    // Add cancellation message
    const cancelMessage: ChatMessageType = {
      role: 'system',
      content: 'Action cancelled by user',
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, cancelMessage],
    }));
  }, [state.pendingToolCall]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({
      ...prev,
      inputValue: e.target.value,
    }));
  };

  // Handle input key down (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Debounce rapid submissions (300ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        handleSendMessage();
        debounceTimerRef.current = null;
      }, 300);
    }
  };

  // Handle retry button click
  const handleRetry = () => {
    if (state.error && state.messages.length > 0) {
      // Find the last user message
      const lastUserMessage = [...state.messages]
        .reverse()
        .find(msg => msg.role === 'user');
      
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__messages">
        {state.messages.map((message, index) => (
          <ChatMessage
            key={`${message.timestamp}-${index}`}
            message={message}
            role={message.role}
          />
        ))}
        
        {state.isLoading && (
          <div className="chat-panel__loading">
            <div className="loading-spinner" />
            <span>AI is thinking...</span>
          </div>
        )}

        {state.error && (
          <div className="chat-panel__error">
            <button
              className="retry-button"
              onClick={handleRetry}
              disabled={state.isLoading}
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-panel__input-area">
        <textarea
          className="chat-panel__input"
          value={state.inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about your project..."
          disabled={state.isLoading}
          rows={3}
        />
        <button
          className="chat-panel__send-button"
          onClick={() => handleSendMessage()}
          disabled={state.isLoading || !state.inputValue.trim()}
        >
          Send
        </button>
      </div>

      {state.pendingToolCall && (
        <ConfirmToolCallDialog
          toolCall={state.pendingToolCall}
          onConfirm={handleConfirmToolCall}
          onCancel={handleCancelToolCall}
        />
      )}
    </div>
  );
}
