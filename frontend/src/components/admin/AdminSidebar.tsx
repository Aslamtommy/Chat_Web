import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MessageSquare, Clock, Trash2 } from 'lucide-react';
import adminService from '../Services/adminService';
import { openDB, DBSchema } from 'idb';

interface User {
  _id: string;
  username: string;
  lastMessageTimestamp: string | null;
  unreadCount: number;
}

interface AdminSidebarProps {
  onSelectUser: (userId: string | null) => void;
  selectedUserId: string | null;
  socket: any;
  isMobile: boolean;
}

interface UserDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
}

const getDB = async () => {
  return openDB<UserDB>('admin-users-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('users', { keyPath: '_id' });
      store.createIndex('by-username', 'username');
    },
  });
};

const saveUsersToDB = async (users: User[]) => {
  const db = await getDB();
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  await Promise.all(users.map((user) => store.put(user)));
  await tx.done;
  console.log('[AdminSidebar] Saved users to IndexedDB:', users);
};

const getUsersFromDB = async (): Promise<User[]> => {
  const db = await getDB();
  const users = await db.getAll('users');
  console.log('[AdminSidebar] Fetched users from IndexedDB:', users);
  return users;
};

const clearUsersFromDB = async (userId: string) => {
  const db = await getDB();
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  await store.delete(userId);
  await tx.done;
  console.log('[AdminSidebar] Cleared user from IndexedDB:', userId);
};

const AdminSidebar = ({ onSelectUser, selectedUserId, socket, isMobile }: AdminSidebarProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousSelectedUserId = useRef<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const socketConnected = useRef(false);
  const hasFetchedInitialCounts = useRef(false);
  const hasFetchedUsers = useRef(false); // Flag to prevent redundant fetches

  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      console.log('[AdminSidebar] Debounced search query:', query.trim());
      setSearchQuery(query.trim());
    }, 300);
  }, []);

  const sortUsersByTimestamp = useCallback((usersList: User[]) => {
    const sorted = usersList.sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
    });
    console.log('[AdminSidebar] Sorted users by timestamp:', sorted);
    return sorted;
  }, []);

  const fetchUserList = useCallback(async () => {
    if (hasFetchedUsers.current) return; // Prevent redundant fetches
    console.log('[AdminSidebar] Fetching user list, online:', navigator.onLine);
    try {
      setIsLoading(true);
      setError(null);

      let initialUsers: User[] = [];
      if (!navigator.onLine) {
        const cachedUsers = await getUsersFromDB();
        if (cachedUsers.length > 0) {
          console.log('[AdminSidebar] Using cached users:', cachedUsers);
          initialUsers = cachedUsers;
        }
      } else {
        const userList = await adminService.getAllUsers();
        console.log('[AdminSidebar] Received user list from API:', userList);
        initialUsers = userList.map((user: any) => ({
          _id: user._id,
          username: user.username,
          lastMessageTimestamp: user.lastMessageTimestamp || null,
          unreadCount: 0, // Initial placeholder
        }));
        console.log('[AdminSidebar] Initial users with unreadCount 0:', initialUsers);
        await saveUsersToDB(initialUsers);
      }
      setUsers((prevUsers) => {
        const mergedUsers = [...prevUsers, ...initialUsers.filter((u) => !prevUsers.some((p) => p._id === u._id))];
        console.log('[AdminSidebar] Merged users:', mergedUsers);
        return sortUsersByTimestamp(mergedUsers);
      });
      hasFetchedUsers.current = true;
    } catch (err) {
      console.error('[AdminSidebar] Error fetching users:', err);
      setError('Failed to load users');
      const cachedUsers = await getUsersFromDB();
      if (cachedUsers.length > 0) {
        console.log('[AdminSidebar] Falling back to cached users:', cachedUsers);
        setUsers((prevUsers) => sortUsersByTimestamp([...prevUsers, ...cachedUsers]));
      }
    } finally {
      setIsLoading(false);
      console.log('[AdminSidebar] FetchUserList completed, users state:', users);
    }
  }, [sortUsersByTimestamp]);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user and their chat history?')) {
      try {
        console.log('[AdminSidebar] Deleting user:', userId);
        await adminService.deleteUser(userId);
        await clearUsersFromDB(userId);
        setUsers((prev) => sortUsersByTimestamp(prev.filter((user) => user._id !== userId)));
        if (selectedUserId === userId) {
          onSelectUser(null);
        }
        if (socket) {
          console.log('[AdminSidebar] Emitting userDeleted for:', userId);
          socket.emit('userDeleted', { userId });
        }
      } catch (error) {
        console.error('[AdminSidebar] Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  useEffect(() => {
    console.log('[AdminSidebar] Mounting component');
    fetchUserList();

    if (!socket) {
      console.log('[AdminSidebar] No socket provided');
      return;
    }

    const handleConnect = () => {
      console.log('[AdminSidebar] Socket connected');
      socketConnected.current = true;
      hasFetchedInitialCounts.current = false;
      socket.emit('syncUnreadCounts');
    };

    const handleDisconnect = () => {
      console.log('[AdminSidebar] Socket disconnected');
      socketConnected.current = false;
    };

    const handleInitialUnreadCounts = (unreadCounts: { [key: string]: number }) => {
      console.log('[AdminSidebar] Received initial unread counts at:', new Date().toISOString(), 'data:', unreadCounts);
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => ({
          ...user,
          unreadCount: unreadCounts[user._id] || user.unreadCount, // Merge with existing count
        })).filter((user) => user._id in unreadCounts || user.unreadCount > 0); // Keep only relevant users
        console.log('[AdminSidebar] Updated users with unread counts:', updatedUsers);
        hasFetchedInitialCounts.current = true;
        saveUsersToDB(updatedUsers);
        return sortUsersByTimestamp(updatedUsers);
      });
    };

    const handleUpdateUnreadCount = ({ userId, unreadCount }: { userId: string; unreadCount: number }) => {
      console.log('[AdminSidebar] Updating unread count for:', userId, 'to:', unreadCount);
      setUsers((prev) => {
        const updatedUsers = prev.map((user) =>
          user._id === userId && selectedUserId !== userId
            ? { ...user, unreadCount }
            : user
        );
        console.log('[AdminSidebar] Updated users after unread count:', updatedUsers);
        saveUsersToDB(updatedUsers);
        return sortUsersByTimestamp(updatedUsers);
      });
    };

    const handleUpdateUserOrder = ({ userId, timestamp }: { userId: string; timestamp: string }) => {
      console.log('[AdminSidebar] Received updateUserOrder - userId:', userId, 'timestamp:', timestamp);
      setUsers((prev) => {
        const updatedUsers = prev.map((user) =>
          user._id === userId
            ? { ...user, lastMessageTimestamp: timestamp }
            : user
        );
        console.log('[AdminSidebar] Updated users after order:', updatedUsers);
        saveUsersToDB(updatedUsers);
        return sortUsersByTimestamp(updatedUsers);
      });
    };

    const handleUserDeleted = ({ userId }: { userId: string }) => {
      console.log('[AdminSidebar] User deleted event received for:', userId);
      setUsers((prev) => sortUsersByTimestamp(prev.filter((user) => user._id !== userId)));
      if (selectedUserId === userId) {
        onSelectUser(null);
      }
      clearUsersFromDB(userId);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('initialUnreadCounts', handleInitialUnreadCounts);
    socket.on('updateUnreadCount', handleUpdateUnreadCount);
    socket.on('updateUserOrder', handleUpdateUserOrder);
    socket.on('userDeleted', handleUserDeleted);

    if (socket.connected) {
      console.log('[AdminSidebar] Socket already connected, emitting syncUnreadCounts');
      socket.emit('syncUnreadCounts');
    }

    return () => {
      console.log('[AdminSidebar] Unmounting component');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('initialUnreadCounts', handleInitialUnreadCounts);
      socket.off('updateUnreadCount', handleUpdateUnreadCount);
      socket.off('updateUserOrder', handleUpdateUserOrder);
      socket.off('userDeleted', handleUserDeleted);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [socket, sortUsersByTimestamp, fetchUserList, selectedUserId, onSelectUser]);

  useEffect(() => {
    console.log('[AdminSidebar] Selected user changed, previous:', previousSelectedUserId.current, 'current:', selectedUserId);
    if (previousSelectedUserId.current && !selectedUserId) {
      // No action needed here; counts persist via socket
    }
    previousSelectedUserId.current = selectedUserId;

    if (selectedUserId) {
      console.log('[AdminSidebar] Marking messages as read for:', selectedUserId);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === selectedUserId ? { ...user, unreadCount: 0 } : user
        )
      );
    }
  }, [selectedUserId]);

  const handleUserClick = async (userId: string) => {
    console.log('[AdminSidebar] User clicked:', userId);
    try {
      const user = users.find((u) => u._id === userId);
      if (user?.unreadCount && user.unreadCount > 0 && socket) {
        console.log('[AdminSidebar] Marking messages as read for:', userId, 'count:', user.unreadCount);
        await adminService.markMessagesAsRead(userId);
        socket.emit('markMessagesAsRead', { chatId: userId });
        setUsers((prev) => {
          const updatedUsers = prev.map((u) => (u._id === userId ? { ...u, unreadCount: 0 } : u));
          console.log('[AdminSidebar] Updated users after marking read:', updatedUsers);
          saveUsersToDB(updatedUsers);
          return updatedUsers;
        });
      }
      onSelectUser(userId);
    } catch (error) {
      console.error('[AdminSidebar] Error marking messages as read:', error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${isMobile ? 'w-full' : 'w-80'} bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-xl border-r border-white/10 h-full overflow-y-auto shadow-2xl`}>
      <div className="p-6 border-b border-white/10">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5 group-hover:text-amber-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full p-3.5 pl-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200 hover:border-white/20"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 space-y-2">
        {isLoading || !hasFetchedInitialCounts.current ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-500 bg-red-500/10 rounded-xl p-4">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/70 space-y-3">
            <MessageSquare className="w-10 h-10 text-amber-500/50" />
            <p className="text-lg">No users found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserClick(user._id)}
                className={`p-4 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-300 ${
                  selectedUserId === user._id
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 shadow-lg shadow-amber-500/20'
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                      selectedUserId === user._id
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-white/90">{user.username}</p>
                    {user.lastMessageTimestamp && (
                      <div className="flex items-center space-x-1 text-xs text-white/50">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(user.lastMessageTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user.unreadCount > 0 && selectedUserId !== user._id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {user.unreadCount}
                      </span>
                    </motion.div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user._id);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;