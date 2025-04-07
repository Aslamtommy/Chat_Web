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
import ContactUs from './components/Pages/ContactUs';
import TermsAndConditions from './components/Pages/TermsAndConditions';

const AppContent = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
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

    const handlePopstate = () => {
      if (token && location.pathname === '/') {
        // If authenticated and navigating back to '/', stay on /home
        window.history.pushState({}, '', '/home');
        navigate('/home', { replace: true });
      } else if (adminToken && location.pathname === '/') {
        // For admin, redirect to dashboard if trying to go back to landing
        window.history.pushState({}, '', '/admin/dashboard');
        navigate('/admin/dashboard', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopstate);

    // Initial check to redirect authenticated users from landing page
    if (token && location.pathname === '/') {
      navigate('/home', { replace: true });
    } else if (adminToken && location.pathname === '/') {
      navigate('/admin/dashboard', { replace: true });
    }

    return () => window.removeEventListener('popstate', handlePopstate);
  }, [location.pathname, navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
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