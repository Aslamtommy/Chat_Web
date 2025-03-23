import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, MotionProps } from 'framer-motion';
import { X, User } from 'lucide-react';

// Define custom types to combine MotionProps with HTML attributes
type MotionDivProps = MotionProps & React.HTMLAttributes<HTMLDivElement>;
type MotionButtonProps = MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    fathersName: '',
    mothersName: '',
    phoneNo: '',
    place: '',
    district: '',
  });

  // Update formData when modal opens to reflect current user data
  useEffect(() => {
    if (isModalOpen && user) {
      setFormData({
        age: user.age?.toString() || '',
        fathersName: user.fathersName || '',
        mothersName: user.mothersName || '',
        phoneNo: user.phoneNo || '',
        place: user.place || '',
        district: user.district || '',
      });
    }
  }, [isModalOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: any = await api.put('/auth/profile', {
        age: Number(formData.age),
        fathersName: formData.fathersName,
        mothersName: formData.mothersName,
        phoneNo: formData.phoneNo,
        place: formData.place,
        district: formData.district,
      });
      if (response.data.success) {
        setUser(response.data.data);
        setIsModalOpen(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(response.data.error);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'An error occurred while updating profile');
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
  };

  if (!user) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-medium"
        {...({} as MotionDivProps)}
      >
        Please log in to view your profile
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
      {...({} as MotionDivProps)}
    >
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 transform transition-all hover:shadow-2xl border border-indigo-100">
        {/* Header Section */}
        <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
          <div className="flex-shrink-0">
            <User className="h-16 w-16 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user.username}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">Profile Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Age', value: user.age || 'Not set' },
              { label: 'Phone Number', value: user.phoneNo || 'Not set' },
              { label: "Father's Name", value: user.fathersName || 'Not set' },
              { label: "Mother's Name", value: user.mothersName || 'Not set' },
              { label: 'Place', value: user.place || 'Not set' },
              { label: 'District', value: user.district || 'Not set' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-indigo-700">{label}</p>
                <p className="mt-1 text-base text-gray-900">{value}</p>
              </div>
            ))}
          </div>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-semibold shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            {...({} as MotionButtonProps)}
          >
            Edit Profile
          </motion.button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
          {...({} as MotionDivProps)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            {...({} as MotionDivProps)}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Your Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                />
              </div>
              <div>
                <label htmlFor="fathersName" className="block text-sm font-medium text-gray-700">
                  Father's Name
                </label>
                <input
                  id="fathersName"
                  type="text"
                  name="fathersName"
                  value={formData.fathersName}
                  onChange={handleChange}
                  placeholder="Enter father's name"
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                />
              </div>
              <div>
                <label htmlFor="mothersName" className="block text-sm font-medium text-gray-700">
                  Mother's Name
                </label>
                <input
                  id="mothersName"
                  type="text"
                  name="mothersName"
                  value={formData.mothersName}
                  onChange={handleChange}
                  placeholder="Enter mother's name"
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phoneNo"
                  type="tel"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="place" className="block text-sm font-medium text-gray-700">
                    Place
                  </label>
                  <input
                    id="place"
                    type="text"
                    name="place"
                    value={formData.place}
                    onChange={handleChange}
                    placeholder="Enter your place"
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                    District
                  </label>
                  <input
                    id="district"
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Enter your district"
                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300 font-medium shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  {...({} as MotionButtonProps)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-medium shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  {...({} as MotionButtonProps)}
                >
                  Save Changes
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfilePage;