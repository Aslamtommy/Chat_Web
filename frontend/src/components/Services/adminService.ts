import axios from 'axios';
import { clearMessagesForUser, saveMessages, getMessagesFromDB } from  '../../utils/indexedDB';
 
const API_URL = `${import.meta.env.VITE_API_URL}/admin`;

const adminService = {
  adminLogin: async (data: { email: string; password: string }) => {
    const response: any = await axios.post(`${API_URL}/auth/login`, data);
    if (!response.data.success) throw new Error(response.data.error || 'Admin login failed');
    return response.data.data; // { token, user }
  },

  getAllUsers: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');

    // Get users with their last message in a single API call
    const response: any = await axios.get(`${API_URL}/users/with-last-message`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch users');
    return response.data.data;
  },

  getUserById: async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');
    const response: any = await axios.get(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch user');
    return response.data.data;
  },

  getUserChatHistory: async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');
    const response: any = await axios.get(`${API_URL}/chats/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch chat history');
    return response.data.data;
  },

  sendMessageToUser: async (userId: string, messageType: 'text' | 'image' | 'voice', content: string | File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');

    const formData = new FormData();
    formData.append('messageType', messageType);
    if (messageType === 'text') {
      formData.append('content', content as string);
    } else {
      formData.append('file', content as File);
    }

    const response: any = await axios.post(`${API_URL}/chats/user/${userId}/message`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) throw new Error(response.data.error || 'Failed to send message');
    return response.data.data;
  },

  getUnreadCounts: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');
    const response: any = await axios.get(`${API_URL}/chats/unread-counts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch unread counts');
    return response.data.data;
  },

  markMessagesAsRead: async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');
    const response: any = await axios.post(`${API_URL}/chats/user/${userId}/mark-read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to mark messages as read');
    return response.data.data;
  },

  deleteUser: async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');
    const response: any = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      // Cleanup IndexedDB after successful deletion
      await clearMessagesForUser(userId);
    }
    if (!response.data.success) throw new Error(response.data.error || 'Failed to delete user');
    return response.data.data;
  },
};

export default adminService;
export { saveMessages, getMessagesFromDB, clearMessagesForUser }; // Export for use in other files