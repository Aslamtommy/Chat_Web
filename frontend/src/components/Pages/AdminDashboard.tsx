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
  const syncTriggered = useRef(false); // Track if sync was triggered
  const syncDebounce = useRef<NodeJS.Timeout | null>(null); // Debounce sync requests
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 768;
      console.log('[AdminDashboard] Checking mobile view, width:', window.innerWidth, 'isMobile:', mobile);
      setIsMobileView(mobile);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log('[AdminDashboard] Checking token:', !!token);
    if (!token) {
      console.log('[AdminDashboard] No token, navigating to login');
      navigate('/');
      return;
    }

    if (!socketRef.current) {
      console.log('[AdminDashboard] Initializing socket with token:', token);
      socketRef.current = io(`${import.meta.env.VITE_API_URL}`, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('[AdminDashboard] Socket connected');
        setIsSocketConnected(true);
        if (!syncTriggered.current) {
          triggerSyncUnreadCounts();
          syncTriggered.current = true;
        }
      });

      socketRef.current.on('reconnect', () => {
        console.log('[AdminDashboard] Socket reconnected');
        setIsSocketConnected(true);
        triggerSyncUnreadCounts();
      });

      socketRef.current.on('connect_error', (error: any) => {
        console.error('[AdminDashboard] Socket connection error:', error);
        setIsSocketConnected(false);
      });

      socketRef.current.on('disconnect', () => {
        console.log('[AdminDashboard] Socket disconnected');
        setIsSocketConnected(false);
      });

      socketRef.current.on('initialUnreadCounts', (unreadCounts: any) => {
        console.log('[AdminDashboard] Received initial unread counts:', unreadCounts, 'at:', new Date().toISOString());
      });
    }

    return () => {
      if (socketRef.current) {
        console.log('[AdminDashboard] Cleaning up socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        syncTriggered.current = false;
        if (syncDebounce.current) clearTimeout(syncDebounce.current);
      }
    };
  }, [navigate]);

  const triggerSyncUnreadCounts = () => {
    if (syncDebounce.current) clearTimeout(syncDebounce.current);
    syncDebounce.current = setTimeout(() => {
      console.log('[AdminDashboard] Emitting syncUnreadCounts');
      if (socketRef.current) socketRef.current.emit('syncUnreadCounts');
    }, 500); // Debounce by 500ms
  };

  const handleSelectUser = async (userId: string | null) => {
    console.log('[AdminDashboard] Handling user selection, userId:', userId);
    if (userId === null) {
      setSelectedUserId(null);
      setSelectedUserName(null);
      return;
    }
    setSelectedUserId(userId);
    try {
      const user = await adminService.getUserById(userId);
      console.log('[AdminDashboard] Fetched user details:', user);
      setSelectedUserName(user.username);
    } catch (error) {
      console.error('[AdminDashboard] Failed to fetch user details:', error);
      setSelectedUserName(null);
    }
  };

  const handleBackToUsers = () => {
    console.log('[AdminDashboard] Back to users, resetting selection');
    setSelectedUserId(null);
    setSelectedUserName(null);
    if (socketRef.current) {
      triggerSyncUnreadCounts(); // Use debounced sync
    }
  };

  const handleLogout = () => {
    console.log('[AdminDashboard] Logging out');
    localStorage.removeItem('adminToken');
    if (socketRef.current) {
      console.log('[AdminDashboard] Disconnecting socket on logout');
      socketRef.current.disconnect();
    }
    socketRef.current = null;
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-black/40 backdrop-blur-sm">
      <AdminHeader 
        onLogout={handleLogout} 
        showBackButton={isMobileView && selectedUserId !== null}
        onBack={handleBackToUsers}
        hideOnMobile={isMobileView && selectedUserId !== null}
        isModalOpen={isModalOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {(!isMobileView || selectedUserId === null) && (
          <AdminSidebar
            onSelectUser={handleSelectUser}
            selectedUserId={selectedUserId}
            socket={socketRef.current}
            isMobile={isMobileView}
            isModalOpen={isModalOpen}
          />
        )}
        {(!isMobileView || selectedUserId !== null) && (
          <div className="flex-1 flex flex-col">
            <AdminChatWindow
              userId={selectedUserId}
              username={selectedUserName}
              socket={socketRef.current}
              isMobile={isMobileView}
              onBack={handleBackToUsers}
              onModalOpen={() => setIsModalOpen(true)}
              onModalClose={() => setIsModalOpen(false)}
            />
          </div>
        )}
        {!isSocketConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white/70 text-lg">Connecting to server...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;