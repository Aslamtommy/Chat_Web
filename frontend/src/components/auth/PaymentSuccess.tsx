import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false); // Prevent double execution

  useEffect(() => {
    if (hasRun.current) return; // Skip if already run
    hasRun.current = true;

    const finalizeRegistration = async () => {
      const userDataString = new URLSearchParams(location.search).get('userData');
      if (!userDataString) {
        toast.error('Registration data missing. Please try again.', {
          duration: 4000,
          position: 'top-center',
          style: { background: '#333', color: '#fff' },
        });
        navigate('/', { replace: true });
        return;
      }

      const userData = JSON.parse(decodeURIComponent(userDataString));
      
      try {
        const response: any = await axios.post(`${import.meta.env.VITE_API_URL}/auth/finalize-registration`, userData);
        if (!response.data.success || !response.data.data.token) {
          throw new Error(response.data.error || 'Failed to finalize registration');
        }

        const token = response.data.data.token;
        localStorage.setItem('token', token);
        console.log('Token set in localStorage:', token);

        toast.success('Payment successful! Welcome to your dashboard...', {
          duration: 4000,
          position: 'top-center',
          style: { background: '#333', color: '#fff' },
        });

        navigate('/home', { replace: true });
      } catch (error) {
        console.error('Finalize registration error:', error);
        const errorMessage = (error as Error).message || 'Unknown error';
        toast.error('Failed to complete registration: ' + errorMessage, {
          duration: 4000,
          position: 'top-center',
          style: { background: '#333', color: '#fff' },
        });
        navigate('/', { replace: true });
      }
    };

    finalizeRegistration();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center h-screen bg-black/40">
      <p className="text-white text-lg">Processing payment...</p>
    </div>
  );
};

export default PaymentSuccess;