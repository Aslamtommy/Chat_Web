import React, { useState } from 'react';
import Button from '../common/Button';

interface MessageInputProps {
  sendMessage: (message: string | File, messageType: 'text' | 'image') => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      sendMessage(file, 'image');
      setFile(null);
    } else if (text.trim()) {
      sendMessage(text, 'text');
      setText('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-4 bg-white border-t border-gray-200 flex items-center gap-3 rounded-b-xl"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="p-2 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828V15m-6-9h7a2 2 0 012 2v7" />
        </svg>
      </label>
      <Button 
        type="submit" 
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Send
      </Button>
    </form>
  );
};

export default MessageInput;