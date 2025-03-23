import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onRegisterSuccess: (email: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [mothersName, setMothersName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [place, setPlace] = useState('');
  const [district, setDistrict] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!username) newErrors.username = 'Username is required';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!age || isNaN(Number(age)) || Number(age) < 1) newErrors.age = 'Valid age is required';
    if (!fathersName) newErrors.fathersName = "Father's name is required";
    if (!mothersName) newErrors.mothersName = "Mother's name is required";
    if (!phoneNo || !/^\d{10}$/.test(phoneNo)) newErrors.phoneNo = 'Valid 10-digit phone number is required';
    if (!place) newErrors.place = 'Place is required';
    if (!district) newErrors.district = 'District is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true); // Start loading

    try {
      const response: any = await api.post('/auth/register', {
        username,
        email,
        password,
        age: Number(age),
        fathersName,
        mothersName,
        phoneNo,
        place,
        district,
      });

      if (response.data.success) {
        toast.success('Registration successful! Please log in.');
        onRegisterSuccess(email);
      } else {
        const errorMessage = response.data.error || 'Registration failed';
        if (errorMessage === 'Email already exists') {
          setErrors({ email: 'Email already exists' });
        } else {
          setErrors({ general: errorMessage });
        }
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'An error occurred during registration';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-900">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-900">
            Age
          </label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your age"
            disabled={isLoading}
            className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.age && <p className="mt-2 text-sm text-red-600">{errors.age}</p>}
        </div>
        <div>
          <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-900">
            Phone Number
          </label>
          <input
            id="phoneNo"
            type="tel"
            value={phoneNo}
            onChange={(e) => setPhoneNo(e.target.value)}
            placeholder="Enter your phone number"
            disabled={isLoading}
            className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
              errors.phoneNo ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.phoneNo && <p className="mt-2 text-sm text-red-600">{errors.phoneNo}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="fathersName" className="block text-sm font-medium text-gray-900">
          Father's Name
        </label>
        <input
          id="fathersName"
          type="text"
          value={fathersName}
          onChange={(e) => setFathersName(e.target.value)}
          placeholder="Enter father's name"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.fathersName ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.fathersName && <p className="mt-2 text-sm text-red-600">{errors.fathersName}</p>}
      </div>
      <div>
        <label htmlFor="mothersName" className="block text-sm font-medium text-gray-900">
          Mother's Name
        </label>
        <input
          id="mothersName"
          type="text"
          value={mothersName}
          onChange={(e) => setMothersName(e.target.value)}
          placeholder="Enter mother's name"
          disabled={isLoading}
          className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
            errors.mothersName ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {errors.mothersName && <p className="mt-2 text-sm text-red-600">{errors.mothersName}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="place" className="block text-sm font-medium text-gray-900">
            Place
          </label>
          <input
            id="place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Enter your place"
            disabled={isLoading}
            className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
              errors.place ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.place && <p className="mt-2 text-sm text-red-600">{errors.place}</p>}
        </div>
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-900">
            District
          </label>
          <input
            id="district"
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Enter your district"
            disabled={isLoading}
            className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-200 ${
              errors.district ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.district && <p className="mt-2 text-sm text-red-600">{errors.district}</p>}
        </div>
      </div>
      {errors.general && <p className="text-sm text-red-600 text-center">{errors.general}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 rounded-lg font-semibold text-white shadow-md transition-all duration-300 ${
          isLoading
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
              ></path>
            </svg>
            Registering...
          </span>
        ) : (
          'Register'
        )}
      </button>
    </form>
  );
};

export default RegisterForm;