import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserNameModalProps {
  onSubmit: (name: string) => void;
  darkMode: boolean;
}

export function UserNameModal({ onSubmit, darkMode }: UserNameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-gradient-to-br from-gray-800 to-gray-950'} ${darkMode ? 'dark' : ''}`}>
      <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white/10 max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-500/20 rounded-full border border-green-400/40">
            <User className="w-10 h-10 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
          </div>
        </div>
        <h2 className="text-3xl font-semibold text-center text-white tracking-wide mb-6">
        Lonely? <span className="text-green-400">Never Again.</span>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Enter your name to continue
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Your name..."
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-400 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
          Lets Chat
          </button>
        </form>
      </div>
    </div>
  );
}
