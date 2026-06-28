import api from './api';

export const commentService = {
  // Comments API
  getComments: async (documentId) => {
    const res = await api.get(`/comments/${documentId}`);
    return res.data;
  },
  createComment: async (documentId, text, range, section, sectionId) => {
    const res = await api.post(`/comments/${documentId}`, { text, range, section, sectionId });
    return res.data;
  },
  replyComment: async (documentId, commentId, text) => {
    const res = await api.post(`/comments/${documentId}/${commentId}/reply`, { text });
    return res.data;
  },
  resolveComment: async (documentId, commentId) => {
    const res = await api.put(`/comments/${documentId}/${commentId}/resolve`);
    return res.data;
  },

  // Versions API
  getVersions: async (documentId) => {
    const res = await api.get(`/versions/${documentId}`);
    return res.data;
  },
  createVersion: async (documentId, name) => {
    const res = await api.post(`/versions/${documentId}`, { name });
    return res.data;
  },
  restoreVersion: async (documentId, versionId) => {
    const res = await api.post(`/versions/${documentId}/${versionId}/restore`);
    return res.data;
  },

  // Suggestions API
  getSuggestions: async (documentId) => {
    const res = await api.get(`/suggestions/${documentId}`);
    return res.data;
  },
  createSuggestion: async (
    documentId,
    originalText,
    suggestedText,
    range,
    section,
    sectionId,
    fieldName
  ) => {
    const res = await api.post(`/suggestions/${documentId}`, {
      originalText,
      suggestedText,
      range,
      section,
      sectionId,
      fieldName
    });
    return res.data;
  },
  acceptSuggestion: async (documentId, suggestionId, documentContent) => {
    const res = await api.put(`/suggestions/${documentId}/${suggestionId}/accept`, { documentContent });
    return res.data;
  },
  rejectSuggestion: async (documentId, suggestionId) => {
    const res = await api.put(`/suggestions/${documentId}/${suggestionId}/reject`);
    return res.data;
  },

  // Invites API
  createInvite: async (documentId, email, role) => {
    const res = await api.post('/invites', { documentId, email, role });
    return res.data;
  },
  acceptInvite: async (token) => {
    const res = await api.post(`/invites/accept/${token}`);
    return res.data;
  },

  // Notifications API
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markNotificationRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  // Activities API
  getActivityLog: async (documentId) => {
    const res = await api.get(`/activity/${documentId}`);
    return res.data;
  },
};
