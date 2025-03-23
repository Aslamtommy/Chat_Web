import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom'; // Add Link
import LoginForm from '../components/auth/LoginForm';
import LoadingOverlay from '../components/common/LoadingOverlay';

const LoginPage: React.FC = () => {
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
            <h2 className="text-3xl font-serif text-gray-900">Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">Access your account</p>
          </div>
          <LoginForm onLogin={handleLogin} />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don’t have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;