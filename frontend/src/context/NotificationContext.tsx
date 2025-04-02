import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchUnreadCount = async () => {
        try {
          const response:any = await axios.get(`${import.meta.env.VITE_API_URL}/auth/payment-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pendingCount = response.data.data.filter((pr: any) => pr.status === 'pending').length;
          setUnreadCount(pendingCount);
        } catch (error) {
          console.error('Failed to fetch payment requests:', error);
        }
      };
      fetchUnreadCount();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};