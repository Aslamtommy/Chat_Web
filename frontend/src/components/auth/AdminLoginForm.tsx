import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface AdminLoginFormProps {
  onLogin: (token: string, user: any) => void;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data }: any = await api.post('/auth/admin/login', { email, password });
      if (data.success) {
        onLogin(data.data.token, data.data.user);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('An error occurred during admin login');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Admin Login</h3>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Admin Email"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin Password"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Admin Login</Button>
    </form>
  );
};

export default AdminLoginForm;