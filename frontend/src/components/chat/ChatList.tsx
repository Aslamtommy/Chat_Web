import { forwardRef } from 'react';
import ChatMessage from './ChatMessage';
import Loading from '../common/Loading';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'screenshot';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
  senderId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface ChatListProps {
  messages: Message[];
  editingMessageId?: string | null;
  editedContent?: string;
  setEditedContent?: (content: string) => void;
  onEditStart?: (messageId: string, content: string) => void;
  onEditSave?: (messageId: string) => void;
  onEditCancel?: () => void;
  onDelete?: (messageId: string) => void; // Optional, only provided for admins
  isLoading?: boolean;
  isSending?: boolean;
}

const ChatList = forwardRef<HTMLDivElement, ChatListProps>(
  (
    {
      messages,
      editingMessageId,
      editedContent,
      setEditedContent,
      onEditStart,
      onEditSave,
      onEditCancel,
      onDelete,
      isLoading = false,
      isSending = false,
    },
    ref
  ) => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <Loading size="lg" variant="mystic" />
        </div>
      );
    }

    return (
      <div ref={ref} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <ChatMessage
            key={message._id}
            _id={message._id}
            content={message.content}
            isSelf={message.isSelf}
            messageType={message.messageType}
            status={message.status}
            duration={message.duration}
            timestamp={message.timestamp}
            senderId={message.senderId}
            isEdited={message.isEdited}
            isDeleted={message.isDeleted}
            isEditing={editingMessageId === message._id}
            editedContent={editedContent}
            onEditChange={setEditedContent}
            onEditSave={onEditSave ? () => onEditSave(message._id) : undefined}
            onEditCancel={onEditCancel}
            onEdit={
              message.isSelf && message.messageType === 'text' && onEditStart
                ? () => onEditStart(message._id, message.content)
                : undefined
            }
            onDelete={
              message.isSelf && onDelete // Only pass onDelete if it exists (admin case)
                ? () => {
                    console.log('onDelete triggered for message:', message._id); // Debugging
                    onDelete(message._id);
                  }
                : undefined
            }
          />
        ))}
        {isSending && (
          <div className="flex justify-end">
            <div className="bg-primary-100 rounded-lg p-3 max-w-[75%]">
              <Loading size="sm" variant="primary" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

ChatList.displayName = 'ChatList';

export default ChatList;