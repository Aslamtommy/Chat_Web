import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import authService from '../Services/authService';
import { FaUser, FaEnvelope, FaLock, FaBirthdayCake, FaUserFriends, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

declare const Cashfree: any;

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  age: number;
  fathersName: string;
  mothersName: string;
  phoneNo: string;
  place: string;
  district: string;
}

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const sanitizeCustomerId = (email: string): string => {
    return email.replace(/[^a-zA-Z0-9_-]/g, '');
  };

  const initiatePayment = async (data: RegisterForm) => {
    try {
      const sanitizedCustomerId = sanitizeCustomerId(data.email);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 499,
          currency: 'INR',
          customer_id: sanitizedCustomerId,
          customer_email: data.email,
          customer_phone: data.phoneNo,
          customer_name: data.username,
          return_url: `${window.location.origin}/payment-success?userData=${encodeURIComponent(JSON.stringify(data))}`,
        }),
      });

      const orderData = await response.json();
      console.log('Order Response:', orderData);
      if (!orderData.success || !orderData.data.payment_session_id) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const cashfree = new Cashfree({
        mode: import.meta.env.VITE_CASHFREE_ENV || 'sandbox',
      });
      console.log('Cashfree SDK initialized:', cashfree);
      cashfree.checkout({
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment: ' + (error as Error).message, {
        duration: 4000,
        position: 'top-center',
        style: { background: '#333', color: '#fff' },
      });
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await authService.register(data);
      if (!response.success) {
        throw new Error(response.error || 'Registration validation failed');
      }
      toast.success('Registration validated! Proceeding to payment...', {
        duration: 4000,
        position: 'top-center',
        style: { background: '#333', color: '#fff' },
      });
      await initiatePayment(data); // Proceed to payment directly
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = (error as Error).message;
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: { background: '#333', color: '#fff' },
      });
    }
  };

  const fields = [
    { name: 'username' as const, placeholder: 'Username', icon: FaUser, validation: { required: 'Username is required' } },
    { name: 'email' as const, placeholder: 'Email', icon: FaEnvelope, validation: { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } } },
    { name: 'password' as const, placeholder: 'Password', type: 'password', icon: FaLock, validation: { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } } },
    { name: 'age' as const, placeholder: 'Age', type: 'number', icon: FaBirthdayCake, validation: { required: 'Age is required', valueAsNumber: true, min: { value: 1, message: 'Age must be a positive number' } } },
    { name: 'fathersName' as const, placeholder: "Father's Name", icon: FaUserFriends, validation: { required: "Father's name is required" } },
    { name: 'mothersName' as const, placeholder: "Mother's Name", icon: FaUserFriends, validation: { required: "Mother's name is required" } },
    { name: 'phoneNo' as const, placeholder: 'Phone Number', icon: FaPhone, validation: { required: 'Phone number is required', pattern: { value: /^\d{10}$/, message: 'Phone number must be 10 digits' } } },
    { name: 'place' as const, placeholder: 'Place', icon: FaMapMarkerAlt, validation: { required: 'Place is required' } },
    { name: 'district' as const, placeholder: 'District', icon: FaMapMarkerAlt, validation: { required: 'District is required' } },
  ];

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-1">
          <div className="relative group">
            <field.icon className="absolute left-4 top-3 text-white/70 group-hover:text-white transition-colors" />
            <input
              {...register(field.name, field.validation)}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-white placeholder-white/50"
            />
          </div>
          {errors[field.name] && (
            <p className="text-red-400 text-sm">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg shadow-amber-500/20"
      >
        {isSubmitting ? 'Processing...' : 'Register & Pay'}
      </motion.button>
    </motion.form>
  );
};

export default Register;