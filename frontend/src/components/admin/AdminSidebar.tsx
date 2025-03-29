import { useState, useEffect, useRef } from 'react';
import  io  from 'socket.io-client';
import adminService from '../Services/adminService';

interface User {
  _id: string;
  username: string;
  role: string;
  lastMessageTimestamp?: string | null;
  hasNewMessages?: boolean;
}

interface AdminSidebarProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
}

const AdminSidebar = ({ onSelectUser, selectedUserId }: AdminSidebarProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [key: string]: string | null }>(() => {
    const saved = localStorage.getItem('lastReadTimestamps');
    return saved ? JSON.parse(saved) : {};
  });
  const socketRef = useRef<any>(null); // Properly type socketRef

 // AdminSidebar.tsx (relevant part)
useEffect(() => {
  const token = localStorage.getItem('adminToken');
  if (!token) return;

  socketRef.current = io('http://localhost:5000', {
    auth: { token },
  });

  socketRef.current.on('newUserMessage', ({ userId }: { userId: string }) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId && user._id !== selectedUserId
          ? { ...user, hasNewMessages: true, lastMessageTimestamp: new Date().toISOString() } // Update timestamp
          : user
      )
    );
  });

  const fetchUsers = async () => {
    try {
      const userList = await adminService.getAllUsers();
      setUsers(
        userList.map((user: User) => {
          const lastRead = lastReadTimestamps[user._id];
          const lastMessageTime = user.lastMessageTimestamp ? new Date(user.lastMessageTimestamp) : null;
          const lastReadTime = lastRead ? new Date(lastRead) : null;
          const hasNewMessages = lastMessageTime && (!lastReadTime || lastMessageTime > lastReadTime);

          return {
            ...user,
            hasNewMessages: Boolean(hasNewMessages),
          };
        })
      );
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  fetchUsers();

  return () => {
    socketRef.current?.disconnect();
  };
}, [lastReadTimestamps, selectedUserId]);

  useEffect(() => {
    localStorage.setItem('lastReadTimestamps', JSON.stringify(lastReadTimestamps));
  }, [lastReadTimestamps]);

  const handleUserClick = (userId: string) => {
    onSelectUser(userId);
    setIsSidebarOpen(false);
    setLastReadTimestamps((prev) => ({
      ...prev,
      [userId]: new Date().toISOString(),
    }));
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user._id === userId ? { ...user, hasNewMessages: false } : user
      )
    );
  };

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
          {users.map((user) => (
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
              {user.hasNewMessages && selectedUserId !== user._id && (
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-accent rounded-full animate-pulse" />
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