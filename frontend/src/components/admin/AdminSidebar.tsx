import { useState, useEffect } from 'react';
import adminService from '../Services/adminService';
import { FiSearch } from 'react-icons/fi';
import { useRef } from 'react';
interface User {
  _id: string;
  username: string;
  lastMessageTimestamp?: string | null;
  unreadCount?: number;
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
  const previousSelectedUserId = useRef<string | null>(null);

  useEffect(() => {
    const fetchUserListAndCounts = async () => {
      const userList = await adminService.getAllUsers();
      const unreadCounts = await adminService.getUnreadCounts();
      setUsers(
        userList.map((user) => ({
          ...user,
          unreadCount: unreadCounts[user._id] || 0,
        }))
      );
    };
    fetchUserListAndCounts();

    const handleUpdateUnreadCount = ({ userId, unreadCount }: { userId: string; unreadCount: number }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, unreadCount } : user
        )
      );
    };

    socket.on('updateUnreadCount', handleUpdateUnreadCount);
    socket.on('syncUnreadCounts', fetchUserListAndCounts);

    return () => {
      socket.off('updateUnreadCount', handleUpdateUnreadCount);
      socket.off('syncUnreadCounts', fetchUserListAndCounts);
    };
  }, [socket]);

  useEffect(() => {
    // When deselecting a user (going back from chat)
    if (previousSelectedUserId.current && !selectedUserId) {
      // Force sync unread counts to ensure accuracy
      socket.emit('syncUnreadCounts');
    }
    previousSelectedUserId.current = selectedUserId;
  }, [selectedUserId, socket]);

  const handleUserClick = async (userId: string) => {
    // Only mark as read if there are actually unread messages
    const user = users.find(u => u._id === userId);
    if (user?.unreadCount && user.unreadCount > 0) {
      await adminService.markMessagesAsRead(userId);
      socket.emit('markMessagesAsRead', { chatId: userId });
    }
    onSelectUser(userId);
  };

  const sortedUsers = [...users].sort((a, b) =>
    (b.lastMessageTimestamp || '').localeCompare(a.lastMessageTimestamp || '')
  );

  return (
    <div className={`${isMobile ? 'w-full' : 'w-72'} bg-black/40 backdrop-blur-md border-r border-white/10 h-full overflow-y-auto`}>
      <div className="p-4 border-b border-white/10">
        <input
          type="text"
          placeholder="Search users"
          className="w-full p-2.5 pl-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="p-2 space-y-1">
        {sortedUsers
          .filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((user) => (
            <div
              key={user._id}
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
              {/* Only show badge if there are unread messages AND this isn't the currently selected chat */}
              {user.unreadCount && selectedUserId !== user._id ? (
                <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">
                  {user.unreadCount}
                </span>
              ) : null}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminSidebar;