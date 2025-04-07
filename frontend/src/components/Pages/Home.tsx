import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ChatHeader from '../chat/ChatHeader';
import ChatList from '../chat/ChatList';
import ChatInput from '../chat/ChatInput';
import ProfileModal from '../Modal/ProfileModal';
import { useNotification } from '../../context/NotificationContext';
import { openDB, DBSchema } from 'idb';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
  senderId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
}

// IndexedDB Schema
interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: Message;
    indexes: { timestamp: string };
  };
}

// IndexedDB Helper Functions
const getDB = async () => {
  return openDB<ChatDB>('chat-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('messages', { keyPath: '_id' });
      store.createIndex('timestamp', 'timestamp');
    },
  });
};

const saveMessages = async (messages: Message[]) => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await Promise.all(messages.map((message) => store.put(message)));
  await tx.done;
};

const getMessagesFromDB = async (): Promise<Message[]> => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readonly');
  const store = tx.objectStore('messages');
  const index = store.index('timestamp');
  const messages = await index.getAll();
  return messages;
};

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab] = useState<'chats' | 'files' | 'profile'>('chats');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const navigate = useNavigate();
  const pendingMessages = useRef<Set<string>>(new Set());
  const userId = useRef<string>('');
  const { setUnreadCount }: any = useNotification();

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      const newMessages = [...prev, { ...message, isSelf: message.senderId === userId.current }];
      saveMessages(newMessages); // Save to IndexedDB
      return newMessages;
    });
    scrollToBottom();
  }, [scrollToBottom]);

  const handleMessageDelivered = useCallback((message: Message) => {
    setMessages((prev: any) => {
      const updatedMessages = prev.map((msg: any) =>
        msg._id === message._id
          ? { ...message, status: 'delivered', isSelf: message.senderId === userId.current }
          : msg
      );
      saveMessages(updatedMessages); // Update IndexedDB
      return updatedMessages;
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    // Check if offline and load cached chat history from IndexedDB
    if (!navigator.onLine) {
      getMessagesFromDB().then((cachedMessages) => {
        setMessages(cachedMessages);
        setTimeout(scrollToBottom, 0);
      }).catch((error) => {
        console.error('Error loading messages from IndexedDB:', error);
      });
      return;
    }

    socketRef.current = io(`${import.meta.env.VITE_API_URL}`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      const decoded = jwtDecode<{ id: string }>(token);
      userId.current = decoded.id;
      console.log('Socket connected, userId:', userId.current);
      socketRef.current?.emit('getChatHistory');
    });

    socketRef.current.on('chatHistory', (chat: { messages: any[] }) => {
      const formattedMessages: Message[] = chat.messages
        .map((msg: any) => ({
          _id: msg._id.toString(),
          content: msg.content || '',
          isSelf: msg.sender_id.toString() === userId.current,
          messageType: msg.message_type || 'text',
          status: 'delivered' as const,
          senderId: msg.sender_id.toString(),
          duration: msg.duration || 0,
          timestamp: msg.timestamp || new Date().toISOString(),
          isEdited: msg.isEdited || false,
          isDeleted: msg.isDeleted || false,
        }))
        .sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());

      setMessages(formattedMessages);
      saveMessages(formattedMessages); // Save to IndexedDB
      setTimeout(scrollToBottom, 0);
    });

    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('messageDelivered', handleMessageDelivered);

    socketRef.current.on('paymentRequest', () => {
      console.log('Received paymentRequest');
      setUnreadCount((prev: any) => prev + 1);
    });

    socketRef.current.on('messageEdited', (updatedMessage: { _id: string; content: string; isEdited: boolean }) => {
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, content: updatedMessage.content, isEdited: true } : msg
        );
        saveMessages(updatedMessages); // Update IndexedDB
        return updatedMessages;
      });
    });

    socketRef.current.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg));
        saveMessages(updatedMessages); // Update IndexedDB
        return updatedMessages;
      });
    });

    socketRef.current.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [navigate, handleNewMessage, handleMessageDelivered, scrollToBottom, setUnreadCount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice', content: string | File, duration?: number) => {
      if (!socketRef.current || !userId.current) return;

      const tempId = Date.now().toString();
      const tempTimestamp = new Date().toISOString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isSelf: true,
        messageType,
        status: 'sending',
        senderId: userId.current,
        duration: messageType === 'voice' ? duration : undefined,
        timestamp: tempTimestamp,
      };

      pendingMessages.current.add(tempId);
      setMessages((prev) => {
        const newMessages = [...prev, tempMessage];
        saveMessages(newMessages); // Save to IndexedDB
        return newMessages;
      });
      scrollToBottom();

      if (!navigator.onLine) {
        setMessages((prev: any) => {
          const updatedMessages = prev.map((msg: any) =>
            msg._id === tempId ? { ...msg, status: 'failed' } : msg
          );
          saveMessages(updatedMessages); // Update IndexedDB
          return updatedMessages;
        });
        pendingMessages.current.delete(tempId);
        return;
      }

      let finalContent: string | ArrayBuffer = content as string;
      if (messageType === 'image' || messageType === 'voice') {
        finalContent = await (content as File).arrayBuffer();
      }

      socketRef.current.emit(
        'sendMessage',
        {
          targetUserId: 'admin',
          messageType,
          content: finalContent,
          duration: messageType === 'voice' ? duration : undefined,
          tempId,
        },
        (ack: { status: string; message?: Message; error?: string }) => {
          if (ack.status === 'success' && ack.message) {
            setMessages((prev: any) => {
              const updatedMessages = prev.map((msg: any) =>
                msg._id === tempId ? { ...ack.message, isSelf: true, status: 'delivered' } : msg
              );
              saveMessages(updatedMessages); // Update IndexedDB
              return updatedMessages;
            });
            pendingMessages.current.delete(tempId);
          } else {
            console.error('Failed to send message:', ack.error);
            setMessages((prev: any) => {
              const updatedMessages = prev.map((msg: any) =>
                msg._id === tempId ? { ...msg, status: 'failed' } : msg
              );
              saveMessages(updatedMessages); // Update IndexedDB
              return updatedMessages;
            });
            pendingMessages.current.delete(tempId);
          }
        }
      );
    },
    [scrollToBottom]
  );

  const handleEditStart = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleEditSave = (messageId: string) => {
    if (!navigator.onLine) {
      // Offline: Update locally only
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg._id === messageId ? { ...msg, content: editedContent, isEdited: true } : msg
        );
        saveMessages(updatedMessages); // Update IndexedDB
        return updatedMessages;
      });
      setEditingMessageId(null);
      setEditedContent('');
      return;
    }

    socketRef.current?.emit(
      'editMessage',
      { messageId, content: editedContent },
      (ack: { status: string }) => {
        if (ack.status === 'success') {
          setMessages((prev) => {
            const updatedMessages = prev.map((msg) =>
              msg._id === messageId ? { ...msg, content: editedContent, isEdited: true } : msg
            );
            saveMessages(updatedMessages); // Update IndexedDB
            return updatedMessages;
          });
          setEditingMessageId(null);
          setEditedContent('');
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-black font-serif">
      <div className="fixed top-0 left-0 right-0 z-50">
        <ChatHeader onProfileClick={() => setIsProfileModalOpen(true)} />
      </div>
      <div className="flex-1 flex flex-col mx-1 sm:mx-4 mb-2 sm:mb-4 mt-1 sm:mt-2 overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 pt-[60px]">
        {activeTab === 'chats' && (
          <>
            <div
              className="flex-1 overflow-y-auto bg-gradient-to-b from-black/40 to-black/20 px-2 sm:px-6 pb-[80px]"
              ref={chatContainerRef}
            >
              <ChatList
                messages={messages}
                editingMessageId={editingMessageId}
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditingMessageId(null)}
              />
            </div>
            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/30 backdrop-blur-md px-2 sm:px-4 py-2 z-50">
              <ChatInput onSend={handleSend} />
            </div>
          </>
        )}
      </div>
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

function jwtDecode<T>(token: string): T {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export default Home;