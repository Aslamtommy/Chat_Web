import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onLogin: (token: string, user: any) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onLogin }) => {
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

    try {
      const registerResponse: any = await api.post('/auth/register', {
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
      if (registerResponse.data.success) {
        const { data }: any = await api.post('/auth/login', { email, password });
        if (data.success) {
          onLogin(data.data.token, data.data.user);
        } else {
          toast.error(data.error);
        }
      } else {
        const errorMessage = registerResponse.data.error;
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your age"
            className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>
        <div>
          <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phoneNo"
            type="tel"
            value={phoneNo}
            onChange={(e) => setPhoneNo(e.target.value)}
            placeholder="Enter your phone number"
            className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.phoneNo ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phoneNo && <p className="mt-1 text-sm text-red-600">{errors.phoneNo}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="fathersName" className="block text-sm font-medium text-gray-700">
          Father's Name
        </label>
        <input
          id="fathersName"
          type="text"
          value={fathersName}
          onChange={(e) => setFathersName(e.target.value)}
          placeholder="Enter father's name"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.fathersName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.fathersName && <p className="mt-1 text-sm text-red-600">{errors.fathersName}</p>}
      </div>
      <div>
        <label htmlFor="mothersName" className="block text-sm font-medium text-gray-700">
          Mother's Name
        </label>
        <input
          id="mothersName"
          type="text"
          value={mothersName}
          onChange={(e) => setMothersName(e.target.value)}
          placeholder="Enter mother's name"
          className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.mothersName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.mothersName && <p className="mt-1 text-sm text-red-600">{errors.mothersName}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="place" className="block text-sm font-medium text-gray-700">
            Place
          </label>
          <input
            id="place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Enter your place"
            className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.place ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.place && <p className="mt-1 text-sm text-red-600">{errors.place}</p>}
        </div>
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">
            District
          </label>
          <input
            id="district"
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Enter your district"
            className={`mt-1 w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.district ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
        </div>
      </div>
      {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;