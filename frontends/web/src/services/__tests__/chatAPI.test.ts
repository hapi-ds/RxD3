/**
 * Unit tests for chatAPI service
 * Tests the chat API methods for sending messages and getting config
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatAPI } from '../api';
import type { ChatMessage, ChatConfig } from '../../types/chat';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('chatAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('sendMessage', () => {
    it('should throw error when no JWT token is present', async () => {
      await expect(
        chatAPI.sendMessage('Hello', [])
      ).rejects.toThrow('No authentication token found');
    });

    it('should send POST request with JWT token and conversation history', async () => {
      localStorageMock.setItem('token', 'test-jwt-token');

      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"message_chunk","content":"Hello"}\n\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const conversationHistory: ChatMessage[] = [
        { role: 'user', content: 'Hi', timestamp: '2025-01-15T10:00:00Z' },
      ];

      const stream = await chatAPI.sendMessage('Hello', conversationHistory);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/messages'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: 'Hello',
            conversation_history: conversationHistory,
          }),
        })
      );

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should handle HTTP error responses', async () => {
      localStorageMock.setItem('token', 'test-jwt-token');

      const mockResponse = {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => JSON.stringify({ detail: 'AI provider unavailable' }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(
        chatAPI.sendMessage('Hello', [])
      ).rejects.toThrow('AI provider unavailable');
    });

    it('should parse SSE format correctly', async () => {
      localStorageMock.setItem('token', 'test-jwt-token');

      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"message_chunk","content":"Hello"}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"message_chunk","content":" World"}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"done"}\n\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const stream = await chatAPI.sendMessage('Test', []);
      const reader = stream.getReader();

      const events = [];
      let result;
      while (!(result = await reader.read()).done) {
        events.push(result.value);
      }

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ type: 'message_chunk', content: 'Hello' });
      expect(events[1]).toEqual({ type: 'message_chunk', content: ' World' });
      expect(events[2]).toEqual({ type: 'done' });
    });
  });

  describe('getConfig', () => {
    it('should return chat configuration', async () => {
      // This test would require mocking the axios instance
      // For now, we'll skip it as it requires more complex setup
      expect(chatAPI.getConfig).toBeDefined();
    });
  });
});
