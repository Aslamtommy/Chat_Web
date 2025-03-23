import { useState, useEffect } from 'react';
import { setToken, getToken, removeToken } from '../utils/auth';
import { setAuthToken, removeAuthToken } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // Add other fields based on your API response
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        setAuthToken(token);
        await fetchUserData(token);
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response:any = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUser(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch user data');
        logout();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch user data');
      logout();
    }
  };

  const login = (token: string, userData: User) => {
    setToken(token);
    setAuthToken(token);
    setUser(userData);
    toast.success('Logged in successfully');
  };

  const logout = () => {
    removeToken();
    removeAuthToken();
    setUser(null);
    toast.success('Logged out successfully');
  };

  return { user, setUser, login, logout, loading };
};
