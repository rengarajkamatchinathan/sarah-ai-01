import React, { useState, useEffect } from 'react';
import { Moon, Sun, Phone, Video, MoreVertical } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { UserNameModal } from './components/UserNameModal';
import type { Message } from './types';

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hey, Hi',
    sender: 'other',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
  },
];

function App() {
  const [darkMode, setDarkMode] = useState(true); // default dark
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setDarkMode(true);

    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
      setShowModal(false);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleUserNameSubmit = (name: string) => {
    localStorage.setItem('userName', name);
    setUserName(name);
    setShowModal(false);
  };

  const handleSendMessage = async (text: string) => {
    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'seen',
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('https://sarah-ai-01.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: text,
          user_id: userName,
        }),
      });

      console.log('REQ=',text)
      const data = await response.json();
      console.log('RES=',data)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'other',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  if (showModal) {
    return <UserNameModal onSubmit={handleUserNameSubmit} darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="h-screen flex flex-col bg-white dark:bg-black transition-all duration-500">
        {/* Header */}
        {/* Header */}
          <div className="h-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-between px-4 border-b dark:border-gray-800 animate-slide-up shadow-sm">
            <div className="flex items-center space-x-3 relative">
              <div className="relative">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL_ZTE2kMJtc8CZj8KE_lRjAA0v1nowyiR1g&s"
                  alt="Sarah"
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                />
                {/* Online dot */}
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-black rounded-full shadow-[0_0_4px_rgba(0,255,0,0.6)]"
                  style={{
                    animation: 'blink-once 0.5s ease-in-out 1',
                  }}
                />

              </div>
              <div className="animate-fade-in">
                <h1 className="font-semibold text-gray-900 dark:text-white">Sarah</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isTyping ? (
                    <span className="italic text-cyan-400 animate-pulse">typing...</span>
                  ) : (
                    'online'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 md:space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(0,255,255,0.5)] transition-all duration-300">
                <Video className="w-5 h-5 text-gray-600 dark:text-cyan-300" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(0,255,255,0.5)] transition-all duration-300">
                <Phone className="w-5 h-5 text-gray-600 dark:text-cyan-300" />
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(255,255,0,0.4)] transition-all duration-300"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all duration-300">
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>


        {/* Chat Window */}
        <ChatWindow messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />
      </div>
    </div>
  );
}

export default App;
