import axios from 'axios';

const API_URL =  `${import.meta.env.VITE_API_URL}/auth`


interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const handleApiError = (error: any): string => {
  if (error.response) {
    console.log(error)
    // Server responded with error
    const errorMessage = error.response.data.error;
    switch (error.response.status) {
      case 400:
        return errorMessage || 'Invalid request. Please check your input.';
      case 401:
        return errorMessage || 'Authentication failed. Please check your credentials.';
      case 404:
        return errorMessage || 'Resource not found.';
      case 409:
        return errorMessage || 'Email already exists.';
      case 422:
        return errorMessage || 'Validation failed. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return errorMessage || 'Something went wrong.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else went wrong
    return 'An unexpected error occurred.';
  }
};

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
    try {
      const response = await axios.post<ApiResponse<any>>(`${API_URL}/register`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  login: async (data: { email: string; password: string }) => {
    try {
      const response = await axios.post<ApiResponse<any>>(`${API_URL}/login`, data);
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<ApiResponse<any>>(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};

export default authService;