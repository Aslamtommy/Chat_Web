import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
  return (
    <>
      <NotificationProvider>
        <Toaster />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <FilesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
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
            <Route path="/contact-us" element={<ContactUs />} /> {/* New Route */}
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} /> {/* New Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </>
  );
};

export default App;