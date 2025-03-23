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
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true); // Start loading

    try {
      const response: any = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        onLogin(response.data.data.token, response.data.data.user);
      } else {
        const errorMessage = response.data.error || 'Login failed';
        setErrors({ general: errorMessage });
        toast.error(errorMessage);
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
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
      </div>
      {errors.general && <p className="text-sm text-red-600 text-center">{errors.general}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 rounded-lg font-semibold text-white shadow-md transition-all duration-300 ${
          isLoading
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
              ></path>
            </svg>
            Signing In...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};

export default LoginForm;