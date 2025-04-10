import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

declare const Cashfree: any; // Declare Cashfree globally

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<{
    _id: string;
    email: string;
    phoneNo: string;
    username: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        console.log('[Payment.tsx] Fetching user data with token:', token.slice(0, 20) + '...');

        const response: any = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('[Payment.tsx] Raw response from /auth/me:', response.data);

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch user data');
        }

        const fetchedUserData = response.data.data;
        console.log('[Payment.tsx] User data fetched:', fetchedUserData);

        const userId = fetchedUserData.id || fetchedUserData._id;
        if (!userId) {
          console.error('[Payment.tsx] No id or _id field in user data:', fetchedUserData);
          throw new Error('User ID not found in response');
        }

        setUserData({
          _id: userId,
          email: fetchedUserData.email,
          phoneNo: fetchedUserData.phoneNo,
          username: fetchedUserData.username,
        });
      } catch (error) {
        console.error('[Payment.tsx] Failed to fetch user data:', error);
        toast.error('Please log in again.', {
          duration: 4000,
          position: 'top-center',
          style: { background: '#333', color: '#fff' },
        });
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      if (!userData) throw new Error('User data not loaded');

      console.log('[Payment.tsx] Preparing payment payload with userData:', userData);

      const paymentPayload = {
        amount: 100,
        currency: 'INR',
        customer_id: userData._id,
        customer_email: userData.email,
        customer_phone: userData.phoneNo,
        customer_name: userData.username,
        return_url: `${window.location.origin}/payment-success?paymentData=${encodeURIComponent(
          JSON.stringify({ orderType: 'credits', userId: userData._id, amount: 100 })
        )}`,
      };

      console.log('[Payment.tsx] Sending payment payload:', paymentPayload);

      const response: any = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/create-order`,
        paymentPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('[Payment.tsx] Payment response (full):', JSON.stringify(response.data, null, 2));

      if (!response.data.success || !response.data.data.payment_session_id) {
        throw new Error(response.data.error || 'Failed to create payment order');
      }

      const cashfree = new Cashfree({
        mode: import.meta.env.VITE_CASHFREE_ENV || 'sandbox',
      });
      console.log('[Payment.tsx] Cashfree SDK initialized:', cashfree);

      cashfree.checkout({
        paymentSessionId: response.data.data.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (error) {
      console.error('[Payment.tsx] Payment initiation error:', error);
      toast.error(`Failed to initiate payment: ${(error as Error).message}`, {
        duration: 4000,
        position: 'top-center',
        style: { background: '#333', color: '#fff' },
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black font-serif text-white">
      <h1 className="text-2xl mb-4">Buy More Message Credits</h1>
      <p className="text-white/60 mb-6">Purchase 20 message credits for Rs. 100</p>
      <button
        onClick={handlePayment}
        disabled={loading || !userData}
        className={`bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-full transition-colors ${
          loading || !userData ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : !userData ? 'Loading...' : 'Pay Now'}
      </button>
    </div>
  );
};

export default Payment;