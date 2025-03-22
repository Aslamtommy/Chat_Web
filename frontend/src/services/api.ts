import axios from 'axios';

const api = axios.create({
  baseURL:   'backend-pi-bice-86.vercel.app/user',
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export default api;