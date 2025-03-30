import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io  from 'socket.io-client';
import AdminHeader from '../admin/AdminHeader';
import AdminSidebar from '../admin/AdminSidebar';
import AdminChatWindow from '../admin/AdminChatWindow';
import AdminUserDetails from '../admin/AdminUserDetails';
import adminService from '../Services/adminService';

const AdminDashboard = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<any >(null);
  const hasSyncedRef = useRef(false); // Track if sync has been emitted
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No admin token found, redirecting to login');
      navigate('/admin/login');
      return;
    }

    if (socketRef.current) {
      console.log('Socket already exists, skipping initialization');
      return;
    }

    socketRef.current = io(`http://localhost:5000`, {     
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected in AdminDashboard');
      setIsSocketConnected(true);
      if (!hasSyncedRef.current) {
        console.log('Emitting syncUnreadCounts');
        socketRef.current?.emit('syncUnreadCounts');
        hasSyncedRef.current = true;
      }
    });

    socketRef.current.on('connect_error', (error:any) => {
      console.error('Socket connection error:', error);
      setIsSocketConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected in AdminDashboard');
      setIsSocketConnected(false);
      hasSyncedRef.current = false; // Reset on disconnect
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log('Socket cleanup performed');
      }
    };
  }, [navigate]);

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const user = await adminService.getUserById(userId);
      setSelectedUserName(user.username);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setSelectedUserName(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col h-screen bg-black/40 backdrop-blur-sm">
      <AdminHeader onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        {isSocketConnected && socketRef.current ? (
          <>
            <AdminSidebar
              onSelectUser={handleSelectUser}
              selectedUserId={selectedUserId}
              socket={socketRef.current}
            />
            <div className="flex-1 flex flex-col">
              <AdminChatWindow
                userId={selectedUserId}
                username={selectedUserName}
                socket={socketRef.current}
              />
              {selectedUserId && (
                <div className="lg:hidden">
                  <AdminUserDetails userId={selectedUserId} />
                </div>
              )}
            </div>
            {selectedUserId && (
              <div className="hidden lg:block w-80 border-l border-white/10 bg-black/20 backdrop-blur-sm">
                <AdminUserDetails userId={selectedUserId} />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-white/70 text-lg">
                {socketRef.current ? 'Connecting to server...' : 'Failed to initialize connection'}
              </p>
              <p className="text-amber-500/60 text-sm">Please check your connection and try again</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;