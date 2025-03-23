// components/common/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, MotionProps } from 'framer-motion';

// Define a type that combines MotionProps with button-specific props
type MotionButtonProps = MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-serif font-semibold tracking-wide">
          Arabic Jyothisham
        </Link>
        <div className="space-x-6">
          {!user ? (
            <>
              <Link to="/login" className="text-white hover:text-gray-200 transition-colors duration-200">
                Login
              </Link>
              <Link to="/register" className="text-white hover:text-gray-200 transition-colors duration-200">
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/home'}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                {user.role === 'admin' ? 'Dashboard' : 'Home'}
              </Link>
              <Link
                to="/profile"
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                Profile
              </Link>
              <motion.button
                onClick={handleLogout}
                className="text-white hover:text-gray-200 focus:outline-none transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                {...({} as MotionButtonProps)} // Type assertion to ensure compatibility
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