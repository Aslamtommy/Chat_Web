import { forwardRef } from 'react';
import ChatMessage from './ChatMessage';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
}

interface ChatListProps {
  messages: Message[];
}

const ChatList = forwardRef<HTMLDivElement, ChatListProps>(({ messages }, ref) => {
  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message) => (
        <ChatMessage
          key={message._id}
          content={message.content}
          isSelf={message.isSelf}
          messageType={message.messageType}
          status={message.status}
          duration={message.duration}
          timestamp={message.timestamp}
        />
      ))}
    </div>
  );
});

ChatList.displayName = 'ChatList';

export default ChatList;