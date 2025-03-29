import axios from 'axios';

const API_URL = 'http://localhost:5000/auth'; // Replace with your backend URL

const authService = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    age: number;
    fathersName: string;
    mothersName: string;
    phoneNo: string;
    place: string;
    district: string;
  }) => {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response:any = await axios.post(`${API_URL}/login`, data);
    return response.data.data  // Assumes { token } is returned
  },
};

export default authService;