import { useState, useEffect } from 'react';
import { setToken, getToken, removeToken } from '../utils/auth';
import { setAuthToken, removeAuthToken } from '../services/api';
import { IUser } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        console.log('Token found on mount:', token);
        setAuthToken(token);
        await fetchUserData(token);
      }
      setLoading(false); // Mark loading complete after initialization
    };
    initializeAuth();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      console.log('Fetching user data with token:', token);
      const response = await fetch('http://localhost:5000/user/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response status:', response.status);
      if (!response.ok) throw new Error('Invalid token');
      const userData = await response.json();
      console.log('User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    }
  };

  const login = (token: string, userData: IUser) => {
    console.log('Logging in with:', { token, userData });
    setToken(token);
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    console.log('Logging out');
    removeToken();
    removeAuthToken();
    setUser(null);
    
  };

  return { user, login, logout, loading };
};