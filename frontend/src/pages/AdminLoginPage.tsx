import React from 'react';
import AdminLoginForm from '../components/auth/AdminLoginForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (token: string, userData: any) => {
    login(token, userData);
    navigate('/admin'); // Always redirect to admin dashboard
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Login</h2>
        <AdminLoginForm onLogin={handleLogin} />
      </div>
    </div>
  );
};

export default AdminLoginPage;