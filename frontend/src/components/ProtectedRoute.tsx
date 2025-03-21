import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - user:', user, 'loading:', loading);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while fetching user
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default ProtectedRoute;