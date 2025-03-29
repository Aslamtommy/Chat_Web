import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import adminService from '../Services/adminService';

interface User {
  _id: string;
  username: string;
  role: string;
  lastMessageTimestamp?: string | null;
  hasNewMessages?: boolean;
  unreadCount?: number;
}

interface AdminSidebarProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
  socket: any;
}

const AdminSidebar = ({ onSelectUser, selectedUserId, socket }: AdminSidebarProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchUserListAndCounts = async () => {
    try {
      const userList = await adminService.getAllUsers();
      const unreadCounts = await adminService.getUnreadCounts();
      console.log('Initial unread counts from API:', unreadCounts);
      setUsers(
        userList.map((user) => ({
          ...user,
          unreadCount: unreadCounts[user._id] || 0,
          hasNewMessages: (unreadCounts[user._id] || 0) > 0,
        }))
      );
    } catch (error) {
      console.error('Failed to load users or unread counts:', error);
    }
  };

  useEffect(() => {
    fetchUserListAndCounts();

    socket.on('initialUnreadCounts', (counts: { [userId: string]: number }) => {
      console.log('Received initial unread counts from socket:', counts);
      setUsers((prev) =>
        prev.map((user) => ({
          ...user,
          unreadCount: counts[user._id] || 0,
          hasNewMessages: (counts[user._id] || 0) > 0,
        }))
      );
    });

    socket.on('requestSyncUnreadCounts', () => {
      console.log('Received request to sync unread counts');
      socket.emit('syncUnreadCounts');
    });

    socket.on('updateUnreadCount', ({ userId, unreadCount }: { userId: string; unreadCount: number }) => {
      console.log(`Received updateUnreadCount: userId=${userId}, unreadCount=${unreadCount}`);
      if (userId !== selectedUserId) {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId
              ? {
                  ...user,
                  unreadCount,
                  hasNewMessages: unreadCount > 0,
                  lastMessageTimestamp: new Date().toISOString(),
                }
              : user
          )
        );
      }
    });

    return () => {
      socket.off('initialUnreadCounts');
      socket.off('requestSyncUnreadCounts');
      socket.off('updateUnreadCount');
    };
  }, [socket, selectedUserId]);

  const handleUserClick = async (userId: string) => {
    console.log(`User clicked: ${userId}, marking messages as read`);
    try {
      await adminService.markMessagesAsRead(userId); // Call the new endpoint
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? { ...user, unreadCount: 0, hasNewMessages: false }
            : user
        )
      );
      socket.emit('markMessagesAsRead', { chatId: userId }); // Keep socket event for real-time updates
      onSelectUser(userId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
    const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary-dark text-secondary hover:bg-primary-light transition-colors"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      <div
        className={`fixed md:static inset-y-0 left-0 w-64 bg-white shadow-deep p-4 transform transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:w-72 h-full overflow-y-auto`}
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users"
            className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-light placeholder:text-muted text-sm"
          />
        </div>
        <div className="space-y-2">
          {sortedUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user._id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                selectedUserId === user._id
                  ? 'bg-primary-light text-secondary'
                  : 'hover:bg-gray-100 text-primary-dark'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-secondary font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold truncate">{user.username}</p>
                  {user.lastMessageTimestamp && (
                    <p className="text-xs text-muted truncate">
                      {new Date(user.lastMessageTimestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
              {user.unreadCount && user.unreadCount > 0 && selectedUserId !== user._id && (
                <div className="flex items-center">
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    {user.unreadCount}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;