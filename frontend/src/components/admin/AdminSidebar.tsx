import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MessageSquare, Clock } from 'lucide-react';
import adminService from '../Services/adminService';

interface User {
  _id: string;
  username: string;
  lastMessageTimestamp: string | null;
  unreadCount: number;
}

interface AdminSidebarProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
  socket: any;
  isMobile: boolean;
}

const AdminSidebar = ({ onSelectUser, selectedUserId, socket, isMobile }: AdminSidebarProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousSelectedUserId = useRef<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const socketConnected = useRef(false);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(query.trim());
    }, 300);
  }, []);

  const syncUnreadCounts = useCallback(() => {
    if (socketConnected.current) {
      console.log('Requesting unread count sync...');
      socket.emit('syncUnreadCounts');
    } else {
      console.log('Socket not connected, cannot sync unread counts');
    }
  }, [socket]);

  const sortUsersByTimestamp = useCallback((usersList: User[]) => {
    const sorted = usersList.sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1; // No timestamp -> bottom
      if (!b.lastMessageTimestamp) return -1;
      return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
    });
    console.log('Sorted users:', sorted.map((u) => ({ id: u._id, timestamp: u.lastMessageTimestamp })));
    return sorted;
  }, []);

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userList = await adminService.getAllUsers();
        const initialUsers = userList.map((user: any) => ({
          _id: user._id,
          username: user.username,
          lastMessageTimestamp: user.lastMessageTimestamp || null,
          unreadCount: 0,
        }));
        console.log('Fetched users:', initialUsers);
        setUsers(sortUsersByTimestamp(initialUsers));
        syncUnreadCounts();
      } catch (err) {
        setError('Failed to load users');
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserList();

    // Handle real-time updates for user order (both user-to-admin and admin-to-user messages)
    const handleUpdateUserOrder = ({ userId, timestamp }: { userId: string; timestamp: string }) => {
      console.log('Received updateUserOrder - userId:', userId, 'timestamp:', timestamp);
      setUsers((prev) => {
        const updatedUsers = prev.map((user) =>
          user._id === userId
            ? {
                ...user,
                lastMessageTimestamp: timestamp, // Update timestamp for the user
                unreadCount: selectedUserId === userId ? 0 : (user.unreadCount || 0) + 1, // Reset if selected, increment if not
              }
            : user
        );
        const sortedUsers = sortUsersByTimestamp([...updatedUsers]);
        console.log(
          'After updateUserOrder, top user:',
          sortedUsers[0]?.username,
          'timestamp:',
          sortedUsers[0]?.lastMessageTimestamp,
          'selectedUserId:',
          selectedUserId
        );
        return sortedUsers;
      });
    };

    const handleInitialUnreadCounts = (unreadCounts: { [key: string]: number }) => {
      console.log('Received initial unread counts:', unreadCounts);
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => ({
          ...user,
          unreadCount: unreadCounts[user._id] || 0,
        }));
        return sortUsersByTimestamp(updatedUsers);
      });
    };

    const handleUpdateUnreadCount = ({ userId, unreadCount }: { userId: string; unreadCount: number }) => {
      console.log('Updating unread count for', userId, 'to', unreadCount);
      setUsers((prev) => {
        const updatedUsers = prev.map((user) =>
          user._id === userId && selectedUserId !== userId
            ? { ...user, unreadCount }
            : user
        );
        return sortUsersByTimestamp(updatedUsers);
      });
    };

    const handleConnect = () => {
      console.log('Socket connected');
      socketConnected.current = true;
      syncUnreadCounts();
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      socketConnected.current = false;
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('initialUnreadCounts', handleInitialUnreadCounts);
    socket.on('updateUnreadCount', handleUpdateUnreadCount);
    socket.on('updateUserOrder', handleUpdateUserOrder);

    if (socket.connected) {
      socketConnected.current = true;
      syncUnreadCounts();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('initialUnreadCounts', handleInitialUnreadCounts);
      socket.off('updateUnreadCount', handleUpdateUnreadCount);
      socket.off('updateUserOrder', handleUpdateUserOrder);
      
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [socket, selectedUserId, syncUnreadCounts, sortUsersByTimestamp]);

  useEffect(() => {
    if (previousSelectedUserId.current && !selectedUserId) {
      syncUnreadCounts();
    }
    previousSelectedUserId.current = selectedUserId;

    if (selectedUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === selectedUserId ? { ...user, unreadCount: 0 } : user
        )
      );
    }
  }, [selectedUserId, syncUnreadCounts]);

  const handleUserClick = async (userId: string) => {
    try {
      const user = users.find((u) => u._id === userId);
      if (user?.unreadCount && user.unreadCount > 0) {
        await adminService.markMessagesAsRead(userId);
        socket.emit('markMessagesAsRead', { chatId: userId });
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, unreadCount: 0 } : u))
        );
      }
      onSelectUser(userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
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
        {isLoading ? (
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
                {user.unreadCount > 0 && selectedUserId !== user._id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <span className="w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg shadow-amber-500/20">
                      {user.unreadCount}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;