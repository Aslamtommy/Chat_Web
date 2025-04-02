import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, CheckCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface PaymentRequest {
  _id: string;
  paymentDetails: {
    accountNumber: string;
    ifscCode: string;
    amount: string;
    name: string;
    upiId: string;
  };
  status: 'pending' | 'uploaded';
  screenshotUrl?: string;
}

const NotificationsPage = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const { setUnreadCount }:any = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchPaymentRequests = async () => {
      try {
        const response:any = await axios.get(`${import.meta.env.VITE_API_URL}/auth/payment-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaymentRequests(response.data.data);
      } catch (error) {
        console.error('Failed to fetch payment requests:', error);
      }
    };

    fetchPaymentRequests();
  }, [navigate]);

  const handleUpload = async (id: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response :any= await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/payment-request/${id}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setPaymentRequests((prev) =>
        prev.map((pr) => (pr._id === id ? response.data.data : pr))
      );
      setUnreadCount((prev:any) => prev - 1);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black font-serif">
      <header className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 p-4 border-b border-white/10">
        <h1 className="text-xl font-semibold text-white">Payment Requests</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 bg-black/20 backdrop-blur-sm">
        {paymentRequests.length === 0 ? (
          <p className="text-white/70 text-center mt-10">No payment requests found.</p>
        ) : (
          paymentRequests.map((pr) => (
            <motion.div
              key={pr._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-gray-900 rounded-lg shadow-md border border-white/10"
            >
              <div className="space-y-2 text-sm text-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Account Number:</span>
                  <span>{pr.paymentDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">IFSC Code:</span>
                  <span>{pr.paymentDetails.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Amount:</span>
                  <span className="text-amber-400 font-semibold">₹{pr.paymentDetails.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Name:</span>
                  <span>{pr.paymentDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">UPI ID:</span>
                  <span>{pr.paymentDetails.upiId}</span>
                </div>
              </div>
              <div className="mt-4">
                {pr.status === 'pending' ? (
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-medium text-sm shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Payment Proof</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(pr._id, file);
                      }}
                      className="hidden"
                    />
                  </motion.label>
                ) : (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Uploaded</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;