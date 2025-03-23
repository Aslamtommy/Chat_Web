import React, { useEffect, useRef } from 'react';

interface UserChatWindowProps {
  messages: any[];
  userId: string;
}

const UserChatWindow: React.FC<UserChatWindowProps> = ({ messages, userId }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-6 bg-accent rounded-t-xl"
    >
      {messages.length === 0 ? (
        <div className="text-center text-text-muted mt-10 font-sans">
          Start your consultation now!
        </div>
      ) : (
        messages.map((msg: any, index: number) => (
          <div
            key={index}
            className={`mb-4 ${msg.sender_id?.toString() === userId ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-3 rounded-lg shadow-soft bg-white text-text`}
            >
              {msg.message_type === 'text' ? (
                msg.content
              ) : msg.message_type === 'image' ? (
                <img src={msg.content} alt="Shared" className="max-w-xs rounded" />
              ) : msg.message_type === 'voice' ? (
                <audio controls src={msg.content} className="max-w-xs" />
              ) : null}
            </div>
            <p className="text-xs text-text-muted mt-1 font-sans">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default UserChatWindow;