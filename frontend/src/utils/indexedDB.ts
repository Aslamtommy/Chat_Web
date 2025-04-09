import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: {
      _id: string;
      content: string;
      isSelf: boolean;
      messageType?: 'text' | 'image' | 'voice';
      status: 'sending' | 'sent' | 'delivered' | 'failed';
      senderId?: string;
      chatId?: string;
      timestamp?: string;
      isEdited?: boolean;
      isDeleted?: boolean;
      duration?: number;
      userId: string;
    };
    indexes: { 'timestamp-userId': [string, string] };
  };
}

export const getDB = async (): Promise<IDBPDatabase<ChatDB>> => {
  return openDB<ChatDB>('admin-chat-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('messages', { keyPath: '_id' });
      store.createIndex('timestamp-userId', ['timestamp', 'userId']);
    },
  });
};

export const clearMessagesForUser = async (userId: string) => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  const index = store.index('timestamp-userId');
  const keys = await index.getAllKeys(IDBKeyRange.bound(['', userId], ['￿', userId]));
  await Promise.all(keys.map((key) => store.delete(key)));
  await tx.done;
};

export const saveMessages = async (userId: string, messages: any[]) => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await Promise.all(messages.map((message) => store.put({ ...message, userId })));
  await tx.done;
};

export const getMessagesFromDB = async (userId: string): Promise<any[]> => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readonly');
  const store = tx.objectStore('messages');
  const index = store.index('timestamp-userId');
  const messages = await index.getAll(IDBKeyRange.bound(['', userId], ['￿', userId]));
  return messages.map((msg) => ({
    ...msg,
    userId: undefined, // Remove userId from the returned message
  }));
};