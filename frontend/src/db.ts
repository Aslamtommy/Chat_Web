import { openDB, DBSchema, IDBPDatabase } from 'idb';


export interface Message {
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
interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: Message;
    indexes: { timestamp: string };
  };
}

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<ChatDB>('chat-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('messages', { keyPath: '_id' });
        store.createIndex('timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
};

export const saveMessages = async (messages: Message[]) => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await Promise.all(messages.map((message) => store.put(message)));
  await tx.done;
};

export const getMessages = async (): Promise<Message[]> => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readonly');
  const store = tx.objectStore('messages');
  const index = store.index('timestamp');
  const messages = await index.getAll();
  return messages;
};

export const updateMessage = async (message: Message) => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await store.put(message);
  await tx.done;
};

export const clearMessages = async () => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await store.clear();
  await tx.done;
};