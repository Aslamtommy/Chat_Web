import axios from 'axios';

const API_URL = 'https://chat-web-1ud8.onrender.com/admin';

const adminService = {
  adminLogin: async (data: { email: string; password: string }) => {
    const response: any = await axios.post(`${API_URL}/auth/login`, data);
    if (!response.data.success) throw new Error(response.data.error || 'Admin login failed');
    return response.data.data; // { token, user }
  },

  getAllUsers: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No admin token found. Please log in.');
    const response: any = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch users');

    // Fetch last message timestamp for each user
    const users = response.data.data;
    const usersWithLastMessage = await Promise.all(
      users.map(async (user: any) => {
        try {
          const chat = await adminService.getUserChatHistory(user._id);
          const lastMessage = chat.messages[chat.messages.length - 1];
          return {
            ...user,
            lastMessageTimestamp: lastMessage ? lastMessage.timestamp : null,
          };
        } catch (error) {
          return { ...user, lastMessageTimestamp: null };
        }
      })
    );

    // Sort users by last message timestamp (most recent first)
    return usersWithLastMessage.sort((a: any, b: any) => {
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
    });
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
};

export default adminService;