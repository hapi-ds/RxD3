import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { ChatMessage as ChatMessageType } from '../../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
  role: 'user' | 'assistant' | 'system';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, role }) => {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`chat-message chat-message--${role}`} role="article" aria-label={`${role} message`}>
      <div className="chat-message__content">
        {role === 'assistant' ? (
          <ReactMarkdown
            components={{
              code(props) {
                const { node, className, children, ref, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const isInline = !className;
                
                return !isInline && language ? (
                  <SyntaxHighlighter
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '4px',
                      backgroundColor: '#1e1e1e',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <p className="chat-message__text">{message.content}</p>
        )}
      </div>
      <div className="chat-message__timestamp">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
};
