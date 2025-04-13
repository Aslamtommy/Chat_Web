import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/Pages/LandingPage';
import Register from './components/auth/Register';
import Home from './components/Pages/Home';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLoginPage from './components/Pages/AdminLoginPage';
import AdminDashboard from './components/Pages/AdminDashboard';
import FilesPage from './components/Pages/FilesPage';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './context/NotificationContext';
import NotificationsPage from './components/Pages/NotificationsPage';
import Payment from './components/auth/Payment';
import PaymentSuccess from './components/auth/PaymentSuccess';
import Login from './components/auth/Login';

const AppContent = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null); // null = checking, true/false = result
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    const validateToken = async () => {
      if (adminToken) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/check-token`, {
            method: 'HEAD',
            headers: { 'Authorization': `Bearer ${adminToken}` },
          });
          if (!response.ok) {
            localStorage.removeItem('adminToken');
            setIsTokenValid(false);
            return;
          }
          setIsTokenValid(true);
        } catch (error) {
          localStorage.removeItem('adminToken');
          setIsTokenValid(false);
        }
      } else if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-token`, {
            method: 'HEAD',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) {
            localStorage.removeItem('token');
            setIsTokenValid(false);
            return;
          }
          setIsTokenValid(true);
        } catch (error) {
          localStorage.removeItem('token');
          setIsTokenValid(false);
        }
      } else {
        setIsTokenValid(false);
      }

      // Redirect based on validated token
      if (isTokenValid === false && location.pathname === '/') {
        navigate('/login', { replace: true });
      } else if (adminToken && isTokenValid && location.pathname === '/') {
        navigate('/admin/dashboard', { replace: true });
      } else if (token && isTokenValid && location.pathname === '/') {
        navigate('/home', { replace: true });
      }
    };

    validateToken();

    const handlePopstate = () => {
      if ((token || adminToken) && location.pathname === '/') {
        validateToken();
      }
    };

    window.addEventListener('popstate', handlePopstate);

    return () => window.removeEventListener('popstate', handlePopstate);
  }, [location.pathname, location.state, navigate]);

  if (isTokenValid === null) {
    return <div>Loading...</div>; // Show loading state while checking token
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment" element={<Payment />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              {isOffline && !localStorage.getItem('token') ? (
                <div>
                  <h1>Offline Mode</h1>
                  <p>Please connect to the internet to sign in.</p>
                </div>
              ) : (
                <Home />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              {isOffline && !localStorage.getItem('token') ? (
                <div>
                  <h1>Offline Mode</h1>
                  <p>Please connect to the internet to sign in.</p>
                </div>
              ) : (
                <FilesPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              {isOffline && !localStorage.getItem('token') ? (
                <div>
                  <h1>Offline Mode</h1>
                  <p>Please connect to the internet to sign in.</p>
                </div>
              ) : (
                <NotificationsPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <NotificationProvider>
      <Toaster />
      <Router>
        <AppContent />
      </Router>
    </NotificationProvider>
  );
};

export default App;