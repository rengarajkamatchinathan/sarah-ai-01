import React from 'react';
import { type Chat } from '../types';
import { formatDistanceToNow } from '../utils';

interface ChatListProps {
  chats: Chat[];
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="h-full overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
            selectedChat === chat.id ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          onClick={() => onSelectChat(chat.id)}
        >
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="ml-4 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {chat.name}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(chat.timestamp)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                {chat.lastMessage}
              </p>
              {chat.unread > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {chat.unread}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}