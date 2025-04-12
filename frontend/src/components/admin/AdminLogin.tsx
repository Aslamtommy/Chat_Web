import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import adminService from '../Services/adminService';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';

interface AdminLoginForm {
  email: string;
  password: string;
}

const AdminLogin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data: AdminLoginForm) => {
    try {
      setIsLoading(true);
      const response = await adminService.adminLogin(data);
      const { token } = response;
      if (!token) throw new Error('Token not found in response');
      localStorage.setItem('adminToken', token);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login failed:', error);
      setErrorMessage('Admin login failed: ' + (error as Error).message);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            {...register('email', { required: 'Email is required' })}
            placeholder="Email"
            className="w-full p-2 sm:p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
            disabled={isLoading}
          />
          {errors.email && (
            <span className="text-red-500 text-xs mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>
        <div>
          <input
            {...register('password', { required: 'Password is required' })}
            type="password"
            placeholder="Password"
            className="w-full p-2 sm:p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
            disabled={isLoading}
          />
          {errors.password && (
            <span className="text-red-500 text-xs mt-1 block">
              {errors.password.message}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 text-sm sm:text-base font-medium mt-2 flex items-center justify-center ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <FiLoader className="w-5 h-5 animate-spin" />
          ) : (
            'Admin Login'
          )}
        </button>
      </form>

      {/* Error Modal */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-gradient-to-br from-black via-black/95 to-black/90 p-6 rounded-2xl shadow-2xl border border-amber-500/20 w-full max-w-md mx-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <FiAlertCircle className="w-6 h-6 text-red-400/80" />
                </div>
                <h3 className="text-xl font-medium text-amber-50/90">Login Failed</h3>
              </div>
              <p className="text-amber-400/60 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowError(false)}
                  className="px-6 py-3 bg-black/50 hover:bg-black/70 text-amber-400/80 rounded-xl transition-all duration-300 border border-amber-500/20"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminLogin;