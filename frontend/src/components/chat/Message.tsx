import React from 'react';
import { IMessage } from '../../types';

interface MessageProps {
  message: IMessage;
  isOwnMessage: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isOwnMessage }) => (
  <div className={`mb-4 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
    <div
      className={`inline-block p-3 rounded-lg shadow-sm ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
      }`}
    >
      {message.message_type === 'text' ? (
        <p>{message.content}</p>
      ) : (
        <img src={message.content} alt="Shared image" className="max-w-xs rounded-lg" />
      )}
    </div>
    <p className="text-xs text-gray-500 mt-1">
      {new Date(message.timestamp).toLocaleTimeString()}
    </p>
  </div>
);

export default Message;