import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import AdminHeader from '../admin/AdminHeader';
import AdminSidebar from '../admin/AdminSidebar';
import AdminChatWindow from '../admin/AdminChatWindow';
import adminService from '../Services/adminService';

const AdminDashboard = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const socketRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(`${import.meta.env.VITE_API_URL}`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        setIsSocketConnected(true);
        console.log('Admin socket connected');
        socketRef.current.emit('syncUnreadCounts');
      });

      socketRef.current.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        setIsSocketConnected(false);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Admin socket disconnected');
        setIsSocketConnected(false);
      });

      socketRef.current.on('initialUnreadCounts', (unreadCounts: any) => {
        console.log('Received initial unread counts in AdminDashboard:', unreadCounts);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
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

  const handleBackToUsers = () => {
    setSelectedUserId(null);
    setSelectedUserName(null);
    if (socketRef.current) {
      socketRef.current.emit('syncUnreadCounts');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    if (socketRef.current) socketRef.current.disconnect();
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col h-screen bg-black/40 backdrop-blur-sm">
      <AdminHeader 
        onLogout={handleLogout} 
        showBackButton={isMobileView && selectedUserId !== null}
        onBack={handleBackToUsers}
      />
      <div className="flex flex-1 overflow-hidden">
        {isSocketConnected && socketRef.current ? (
          <>
            {/* Show sidebar if no user is selected or if not in mobile view */}
            {(!isMobileView || selectedUserId === null) && (
              <AdminSidebar
                onSelectUser={handleSelectUser}
                selectedUserId={selectedUserId}
                socket={socketRef.current}
                isMobile={isMobileView}
              />
            )}
            {/* Show chat window only if a user is selected or if not in mobile view */}
            {(!isMobileView || selectedUserId !== null) && (
              <div className="flex-1 flex flex-col">
                <AdminChatWindow
                  userId={selectedUserId}
                  username={selectedUserName}
                  socket={socketRef.current}
                  isMobile={isMobileView}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/70 text-lg">Connecting to server...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;