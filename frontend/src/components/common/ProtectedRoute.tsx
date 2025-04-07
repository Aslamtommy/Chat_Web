import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminRoute?: boolean;
}

const ProtectedRoute = ({ children, adminRoute = false }: ProtectedRouteProps) => {
  const token = localStorage.getItem(adminRoute ? 'adminToken' : 'token');
  const location = useLocation();
  const redirectPath = adminRoute ? '/admin/login' : '/'; // Redirect to landing page for login modal

  if (!token) {
    // If not authenticated, redirect to landing page with login modal
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;