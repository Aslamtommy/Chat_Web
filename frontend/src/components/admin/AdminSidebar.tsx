import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
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

  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(query.trim());
    }, 300);
  }, []);

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userList = await adminService.getAllUsers();
        setUsers(
          userList.map((user: any) => ({
            _id: user._id,
            username: user.username,
            lastMessageTimestamp: user.lastMessageTimestamp || null,
            unreadCount: 0, // Initial count, updated by socket
          }))
        );
      } catch (err) {
        setError('Failed to load users');
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserList();

    const handleInitialUnreadCounts = (unreadCounts: { [key: string]: number }) => {
      console.log('Received initial unread counts:', unreadCounts);
      setUsers((prev) =>
        prev.map((user) => ({
          ...user,
          unreadCount: unreadCounts[user._id] || 0,
        }))
      );
    };

    const handleUpdateUnreadCount = ({ userId, unreadCount }: { userId: string; unreadCount: number }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId && selectedUserId !== userId
            ? { ...user, unreadCount }
            : user
        )
      );
    };

    socket.on('initialUnreadCounts', handleInitialUnreadCounts);
    socket.on('updateUnreadCount', handleUpdateUnreadCount);

    // Trigger sync on mount
    socket.emit('syncUnreadCounts');

    return () => {
      socket.off('initialUnreadCounts', handleInitialUnreadCounts);
      socket.off('updateUnreadCount', handleUpdateUnreadCount);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [socket, selectedUserId]);

  useEffect(() => {
    if (previousSelectedUserId.current && !selectedUserId) {
      socket.emit('syncUnreadCounts');
    }
    previousSelectedUserId.current = selectedUserId;
  }, [selectedUserId, socket]);

  const handleUserClick = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (user?.unreadCount && user.unreadCount > 0) {
      try {
        await adminService.markMessagesAsRead(userId);
        socket.emit('markMessagesAsRead', { chatId: userId });
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, unreadCount: 0 } : u))
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
    onSelectUser(userId);
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${isMobile ? 'w-full' : 'w-72'} bg-black/40 backdrop-blur-md border-r border-white/10 h-full overflow-y-auto`}>
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users"
            className="w-full p-2.5 pl-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-500">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/70">
            No users found
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onClick={() => handleUserClick(user._id)}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                  selectedUserId === user._id ? 'bg-amber-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 text-white/70 flex items-center justify-center">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium text-white/70">{user.username}</p>
                </div>
                {user.unreadCount > 0 && selectedUserId !== user._id && (
                  <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">
                    {user.unreadCount}
                  </span>
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