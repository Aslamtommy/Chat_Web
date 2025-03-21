// RegisterForm.tsx
import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';

interface RegisterFormProps {
  onLogin: (token: string, user: any) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register payload:', { username, email, password });
    await api.post('/auth/register', { username, email, password });
    const { data }: any = await api.post('/auth/login', { email, password });
    onLogin(data.token, data.user);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button type="submit" className="w-full">Register</Button>
    </form>
  );
};

export default RegisterForm;