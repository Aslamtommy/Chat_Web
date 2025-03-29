import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminRoute?: boolean;
}

const ProtectedRoute = ({ children, adminRoute = false }: ProtectedRouteProps) => {
  const token = localStorage.getItem(adminRoute ? 'adminToken' : 'token');
  const redirectPath = adminRoute ? '/admin/login' : '/login';

  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;