import api from './api';

export const analyticsService = {
  getStats: async () => {
    const res = await api.get('/analytics/stats');
    return res.data;
  },

  getRecentActivity: async () => {
    const res = await api.get('/analytics/recent-activity');
    return res.data;
  },

  getMonthlyCreation: async () => {
    const res = await api.get('/analytics/monthly-creation');
    return res.data;
  },

  getDocumentStats: async () => {
    const res = await api.get('/analytics/document-stats');
    return res.data;
  },

  getProductivity: async () => {
    const res = await api.get('/analytics/productivity');
    return res.data;
  },
};

export default analyticsService;
