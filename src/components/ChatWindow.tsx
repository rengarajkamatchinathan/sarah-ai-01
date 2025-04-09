import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Smile, Check } from 'lucide-react';
import { type Message } from '../types';
import { formatTime } from '../utils';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

export function ChatWindow({ messages, onSendMessage, isTyping }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const MessageStatus = ({ status }: { status?: 'seen' }) => {
    if (!status) return null;

    return (
      <span className="inline-flex ml-1">
        <Check 
          size={14} 
          className="text-[#34B7F1]"
          style={{ marginRight: '-10px' }}
        />
        <Check 
          size={14} 
          className="text-[#34B7F1]"
        />
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] dark:bg-gray-900 h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-[#dcf8c6] dark:bg-[#075E54] text-gray-800 dark:text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
              <div className="flex items-center justify-end mt-1 space-x-1">
                <p className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </p>
                {message.sender === 'user' && <MessageStatus status={message.status} />}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 max-w-[70%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 dark:bg-gray-800 p-4 flex items-center space-x-4"
      >
        <button
          type="button"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Smile size={24} />
        </button>
        <button
          type="button"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Paperclip size={24} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-white dark:bg-gray-700 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
        />
        {newMessage.trim() ? (
          <button
            type="submit"
            className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            <Send size={24} />
          </button>
        ) : (
          <button
            type="button"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Mic size={24} />
          </button>
        )}
      </form>
    </div>
  );
}