import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegistrationForm';

const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (token: string, user: any) => {
    login(token, user);
    navigate(user.role === 'admin' ? '/admin' : '/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Register</h2>
        <RegisterForm onLogin={handleLogin} />
      </div>
    </div>
  );
};

export default RegisterPage;