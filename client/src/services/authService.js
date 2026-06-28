import api from './api';

export const authService = {
  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  requestOTP: async (email) => {
    const res = await api.post('/auth/otp/request', { email });
    return res.data;
  },

  loginWithOTP: async (email, otp) => {
    const res = await api.post('/auth/otp/verify', { email, otp });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },
};
