// components/common/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-serif text-indigo-800 tracking-tight">Arabic Jyothisham</span>
        </Link>
        <div className="space-x-8">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/home'}
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
              >
                {user.role === 'admin' ? 'Dashboard' : 'Home'}
              </Link>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
              >
                Profile
              </Link>
              <motion.button
                onClick={handleLogout}
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;