import React from 'react';
import { IMessage } from '../../types';
import Message from './Message';

interface ChatWindowProps {
  messages: IMessage[];
  userId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, userId }) => (
  <div className="flex-1 overflow-y-auto p-6 bg-gray-100 rounded-t-xl">
    {messages.length === 0 ? (
      <div className="text-center text-gray-500 mt-10">
        No messages yet. Start the conversation!
      </div>
    ) : (
      messages.map((msg, index) => (
        <Message 
          key={index} 
          message={msg} 
          isOwnMessage={msg.sender_id === userId} 
        />
      ))
    )}
  </div>
);

export default ChatWindow;