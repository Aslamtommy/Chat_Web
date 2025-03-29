// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './components/Pages/RegisterPage';
import LoginPage from './components/Pages/LoginPage';
import Home from './components/Pages/Home';
import LandingPage from './components/Pages/LandingPage';
import ProtectedRoute from './components/common/ProtectedRoute';
 
import AdminLoginPage from './components/Pages/AdminLoginPage';
import AdminDashboard from './components/Pages/AdminDashboard';
import FilesPage from './components/Pages/FilesPage';

const App = () => (
  <Router>
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
 
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
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  </Router>
);

export default App;