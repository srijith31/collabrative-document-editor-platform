import api from './api';

export const importPdfToTemplate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/templates/import-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getUserTemplates = async () => {
  const response = await api.get('/templates');
  return response.data;
};

export const getTemplateById = async (id) => {
  const response = await api.get(`/templates/${id}`);
  return response.data;
};

export const updateTemplate = async (id, templateData) => {
  const response = await api.put(`/templates/${id}`, templateData);
  return response.data;
};

export const deleteTemplate = async (id) => {
  const response = await api.delete(`/templates/${id}`);
  return response.data;
};

const templateService = {
  importPdfToTemplate,
  getUserTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};

export default templateService;
