import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/user', // Adjust if your backend runs elsewhere
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export default api;