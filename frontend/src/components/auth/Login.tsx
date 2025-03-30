// Login.jsx
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../Services/authService';
import { FaArrowRight, FaEnvelope, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginProps {
  onSuccess?: () => void;
}

const Login = ({ onSuccess }: LoginProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authService.login(data);
      const { token, user } = response;
      
      if (!token) throw new Error('Token not found in response');
      
      // Store token based on role
      if (user.role === 'admin') {
        localStorage.setItem('adminToken', token);
        toast.success('Admin login successful! Welcome back.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#333',
            color: '#fff',
          },
        });
        navigate('/admin/dashboard');
      } else {
        localStorage.setItem('token', token);
        toast.success('Login successful! Welcome back.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#333',
            color: '#fff',
          },
        });
        navigate('/home');
      }
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-2">
        <div className="relative group">
          <FaEnvelope className="absolute left-4 top-3 text-white/70 group-hover:text-white transition-colors" />
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                message: 'Invalid email address',
              },
            })}
            placeholder="Email"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-white placeholder-white/50"
          />
        </div>
        {errors.email && (
          <p className="text-red-400 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative group">
          <FaLock className="absolute left-4 top-3 text-white/70 group-hover:text-white transition-colors" />
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            type="password"
            placeholder="Password"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-white placeholder-white/50"
          />
        </div>
        {errors.password && (
          <p className="text-red-400 text-sm">{errors.password.message}</p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg shadow-amber-500/20"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
        {!isSubmitting && (
          <FaArrowRight className="inline ml-2" />
        )}
      </motion.button>

      <div className="text-center">
        <p className="text-sm text-white/70">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </motion.form>
  );
};

export default Login;