import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Hook to programmatically navigate

  const handleLogout = () => {
    logout(); // Clear user state and token
    navigate('/'); // Redirect to landing page
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-lg font-bold">Chat App</Link>
        <div className="space-x-4">
          {!user ? (
            <>
              <Link to="/login" className="text-white hover:text-gray-300">Login</Link>
              <Link to="/register" className="text-white hover:text-gray-300">Register</Link>
            </>
          ) : (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/home'}
                className="text-white hover:text-gray-300"
              >
                {user.role === 'admin' ? 'Dashboard' : 'Home'}
              </Link>
              <button
                onClick={handleLogout} // Use the new handler
                className="text-white hover:text-gray-300 focus:outline-none"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;