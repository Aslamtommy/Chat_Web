import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/home'} /> : <>{children}</>;
};

export default PublicRoute;