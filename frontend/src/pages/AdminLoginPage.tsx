import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import LoadingOverlay from '../components/common/LoadingOverlay';

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (token: string, userData: any) => {
    setIsLoading(true);
    login(token, userData);
    navigate(userData.role === 'admin' ? '/admin' : '/home');
    setIsLoading(false);
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-serif text-gray-900">Admin Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">Access your admin account</p>
          </div>
          <LoginForm onLogin={handleLogin} />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Not an admin?{' '}
              <span
                onClick={() => navigate('/login')}
                className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
              >
                User login here
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;