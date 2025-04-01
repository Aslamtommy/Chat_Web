import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/chat`

const chatService = {
  getChatHistory: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');
    const response: any = await axios.get(`${API_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch chat history');
    return response.data.data;
  },

  sendMessage: async (messageType: 'text' | 'image' | 'voice', content: string | File) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    const formData = new FormData();
    formData.append('messageType', messageType);
    if (messageType === 'text') {
      formData.append('content', content as string);
    } else {
      formData.append('file', content as File);
    }

    const response: any = await axios.post(`${API_URL}/message`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) throw new Error(response.data.error || 'Failed to send message');
    return response.data.data;
  },
};

export default chatService;