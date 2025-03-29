import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import authService from '../Services/authService';

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authService.login(data);
      const { token } = response;
      if (!token) throw new Error('Token not found in response');
      localStorage.setItem('token', token);
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + (error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register('email', { required: 'Email is required' })}
          placeholder="Email"
          className="w-full p-2 sm:p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
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
        />
        {errors.password && (
          <span className="text-red-500 text-xs mt-1 block">
            {errors.password.message}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 text-sm sm:text-base font-medium mt-2"
      >
        Login
      </button>
    </form>
  );
};

export default Login;