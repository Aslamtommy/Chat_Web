import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onLogin: (token: string, user: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const { data }: any = await api.post('/auth/login', { email, password });
      if (data.success) {
        onLogin(data.data.token, data.data.user);
      } else {
        setErrors({ general: data.error });
        toast.error(data.error);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'An error occurred during login';
      if (errorMessage === 'Email not found') {
        setErrors({ email: 'Email not found' });
      } else if (errorMessage === 'Incorrect password') {
        setErrors({ password: 'Incorrect password' });
      } else {
        setErrors({ general: errorMessage });
      }
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>
      {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
      >
        Sign In
      </button>
    </form>
  );
};

export default LoginForm;