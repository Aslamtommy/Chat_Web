import { useState, useEffect } from 'react';
import { setToken, getToken, removeToken } from '../utils/auth';
import { setAuthToken, removeAuthToken } from '../services/api';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
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
      const response = await fetch('http://localhost:5000/user/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Failed to fetch user data');
      logout();
    }
  };

  const login = (token: string, userData: any) => {
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