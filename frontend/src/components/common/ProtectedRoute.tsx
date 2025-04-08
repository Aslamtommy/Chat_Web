import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminRoute?: boolean;
}

const ProtectedRoute = ({ children, adminRoute = false }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem(adminRoute ? 'adminToken' : 'token');
  const location = useLocation();
  const redirectPath = adminRoute ? '/admin/login' : '/'; // Redirect to landing page for login modal

  useEffect(() => {
    // Simulate a brief check to ensure token is loaded
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black/40">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;