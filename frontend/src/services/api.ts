import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL  ,
  withCredentials: true,  
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export default api;