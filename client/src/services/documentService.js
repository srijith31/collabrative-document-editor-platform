import api from './api';

export const documentService = {
  getDocuments: async (search, sort, tab) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    if (tab) params.append('tab', tab);
    const res = await api.get(`/documents?${params.toString()}`);
    return res.data;
  },

  createDocument: async (templateId, type) => {
    const res = await api.post('/documents', { templateId, type });
    return res.data;
  },

  // Used by client-side PDF renderer: saves a document with pre-built Quill delta content
  createDocumentWithContent: async (title, content) => {
    const res = await api.post('/documents', { title, type: 'DOCUMENT', content });
    return res.data;
  },

  getDocumentById: async (id) => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },

  updateDocument: async (id, updates) => {
    const res = await api.put(`/documents/${id}`, updates);
    return res.data;
  },

  deleteDocument: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },

  shareDocument: async (id, email, role, action) => {
    const res = await api.put(`/documents/${id}/share`, { email, role, action });
    return res.data;
  },

  importPdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/documents/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  toggleStar: async (id) => {
    const res = await api.put(`/documents/${id}/star`);
    return res.data;
  },

  generateReport: async (id, data) => {
    const res = await api.post(`/documents/${id}/generate-report`, data);
    return res.data;
  },
};
