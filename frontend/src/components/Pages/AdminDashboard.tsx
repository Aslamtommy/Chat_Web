import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../admin/AdminHeader';
import AdminSidebar from '../admin/AdminSidebar';
import AdminChatWindow from '../admin/AdminChatWindow';
import AdminUserDetails from '../admin/AdminUserDetails';
import adminService from '../Services/adminService';

const AdminDashboard = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const navigate = useNavigate();

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
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col h-screen bg-chat-bg">
      <AdminHeader onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar onSelectUser={handleSelectUser} selectedUserId={selectedUserId} />
        <div className="flex-1 flex flex-col md:flex-row">
          <AdminChatWindow userId={selectedUserId} username={selectedUserName} />
          {selectedUserId && <AdminUserDetails userId={selectedUserId} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;