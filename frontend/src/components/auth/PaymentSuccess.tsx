import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const finalizePayment = async () => {
      const paymentDataString = new URLSearchParams(location.search).get('paymentData');
      const token = localStorage.getItem('token');

      console.log('PaymentSuccess - paymentDataString:', paymentDataString);
      console.log('PaymentSuccess - token:', token);

      if (!paymentDataString) {
        toast.error('Payment data missing. Please try again.', {
          duration: 4000,
          position: 'top-center',
          style: { background: '#333', color: '#fff' },
        });
        navigate('/', { replace: true });
        return;
      }

      const paymentData = JSON.parse(decodeURIComponent(paymentDataString));
      const { orderType, ...userData } = paymentData;

      try {
        if (orderType === 'registration') {
          // Finalize registration (no token required yet)
          const response: any = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/finalize-registration`,
            userData
          );
          if (!response.data.success || !response.data.data.token) {
            throw new Error(response.data.error || 'Failed to finalize registration');
          }
          localStorage.setItem('token', response.data.data.token);
          toast.success('Registration and payment successful! Welcome aboard!', {
            duration: 4000,
            position: 'top-center',
            style: { background: '#333', color: '#fff' },
          });
          navigate('/home', { replace: true });
        } else {
          // Finalize credit purchase (token required)
          if (!token) {
            throw new Error('Authentication required for credit purchase');
          }
          const response: any = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/finalize-credits`,
            paymentData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to finalize credits');
          }
          toast.success('Payment successful! 20 credits added to your account.', {
            duration: 4000,
            position: 'top-center',
            style: { background: '#333', color: '#fff' },
          });
          navigate('/home', { replace: true });
        }
      } catch (error) {
        console.error('Payment finalization error:', error);
        const errorMessage = (error as Error).message || 'Unknown error';
        toast.error('Failed to process payment: ' + errorMessage, {
          duration: 4000,
          position: 'top-center',
          style: { background: '#333', color: '#fff' },
        });
        navigate('/', { replace: true });
      }
    };

    finalizePayment();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center h-screen bg-black/40">
      <p className="text-white text-lg">Processing payment...</p>
    </div>
  );
};

export default PaymentSuccess;