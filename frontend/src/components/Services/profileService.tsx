// src/services/profileService.ts
import axios from 'axios';

const API_URL = 'https://chat-web-1ud8.onrender.com/auth';

const profileService = {
  getProfile: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');
    try {
      const response:any = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch profile');
      console.log('Profile response:', response.data); // Debug log
      return response.data.data;
    } catch (error:any) {
      console.error('Get profile error:', error.response?.data || error.message);
      throw error; // Re-throw to handle in component
    }
  },

  updateProfile: async (data: {
    age: number;
    fathersName: string;
    mothersName: string;
    phoneNo: string;
    place: string;
    district: string;
  }) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');
    try {
      const response:any = await axios.put(`${API_URL}/profile`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data.success) throw new Error(response.data.error || 'Failed to update profile');
      return response.data.data;
    } catch (error:any) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default profileService;