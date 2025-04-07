import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, Bell, ArrowLeft, Image, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

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

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative max-w-5xl w-full aspect-[4/3] bg-black/50 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt="Payment Screenshot"
          className="w-full h-full object-contain"
        />
      </motion.div>
    </div>
  );
};

const NotificationsPage = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  
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
        toast.error('Failed to fetch payment requests');
      }
    };

    fetchPaymentRequests();
  }, [navigate]);

  const handleUpload = async (id: string, file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setIsUploading(id);
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
      toast.success('Payment proof uploaded successfully');
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      toast.error('Failed to upload payment proof');
    } finally {
      setIsUploading(null);
    }
  };

  const handleViewScreenshot = (screenshotUrl: string) => {
    try {
      // Ensure the URL is properly formatted
      const fullUrl = screenshotUrl.startsWith('http') 
        ? screenshotUrl 
        : `${import.meta.env.VITE_API_URL}${screenshotUrl}`;

      setSelectedScreenshot(fullUrl);
    } catch (error) {
      console.error('Failed to view screenshot:', error);
      toast.error('Failed to load screenshot. Please try again.');
    }
  };

  const handleBack = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    navigate('/home');
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 font-serif">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="mr-3 sm:mr-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>

              <div className="flex items-center">
                <div className="relative hidden sm:block">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                  <div className="absolute -inset-1 bg-amber-500/20 rounded-lg blur-sm -z-10" />
                </div>
                <div className="flex flex-col sm:ml-3">
                  <h1 className="text-base sm:text-xl font-semibold text-white tracking-wide">
                    Payment Notifications
                  </h1>
                  <p className="text-xs sm:text-sm font-normal text-white/60">
                    Manage your payment requests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {paymentRequests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="col-span-full flex flex-col items-center justify-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <Bell className="w-12 h-12 text-white/30 mb-4" />
                  <p className="text-white/70 text-center text-lg">No payment requests found.</p>
                </motion.div>
              ) : (
                paymentRequests.map((pr) => (
                  <motion.div
                    key={pr._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-amber-500/30 transition-colors duration-300"
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Content container with proper z-index */}
                    <div className="relative z-10 p-6 space-y-4">
                      {/* Payment Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Amount</span>
                          <span className="text-lg font-semibold text-amber-500">₹{pr.paymentDetails.amount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Name</span>
                          <span className="text-white">{pr.paymentDetails.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Account</span>
                          <span className="text-white/80">{pr.paymentDetails.accountNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">IFSC</span>
                          <span className="text-white/80">{pr.paymentDetails.ifscCode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">UPI ID</span>
                          <span className="text-white/80">{pr.paymentDetails.upiId}</span>
                        </div>
                      </div>

                      {/* Status and Actions with proper z-index */}
                      <div className="relative z-20 pt-4 border-t border-white/10">
                        {pr.status === 'pending' ? (
                          <div className="relative">
                            <input
                              type="file"
                              id={`upload-${pr._id}`}
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(pr._id, file);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                              onMouseEnter={() => setHoveredButton(pr._id)}
                              onMouseLeave={() => setHoveredButton(null)}
                            />
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-center justify-center w-full px-4 py-3 rounded-xl bg-gradient-to-r transition-all duration-300 ${
                                hoveredButton === pr._id
                                  ? 'from-amber-600 to-amber-700 shadow-lg shadow-amber-600/30'
                                  : 'from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20'
                              } text-white font-medium cursor-pointer`}
                            >
                              {isUploading === pr._id ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Uploading...</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className={`w-5 h-5 mr-2 transition-transform duration-300 ${
                                    hoveredButton === pr._id ? 'scale-110' : ''
                                  }`} />
                                  <span>Upload Payment Proof</span>
                                </>
                              )}
                            </motion.div>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-center space-x-2 text-emerald-400">
                              <CheckCircle className="w-5 h-5" />
                              <span>Payment Proof Uploaded</span>
                            </div>
                            {pr.screenshotUrl && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewScreenshot(pr.screenshotUrl!);
                                }}
                                className="relative z-30 flex items-center justify-center w-full px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all duration-300 cursor-pointer"
                              >
                                <div className="flex items-center justify-center space-x-2">
                                  <Image className="w-5 h-5" />
                                  <span className="font-medium">View Screenshot</span>
                                </div>
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <ScreenshotModal
            isOpen={true}
            onClose={() => setSelectedScreenshot(null)}
            imageUrl={selectedScreenshot}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationsPage;