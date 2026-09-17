import api from './api';

export const getTasks = async (params = {}) => {
  // Clean up undefined, null, or empty string values from params
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  );
  
  const response = await api.get('/tasks', { params: cleanParams });
  return response.data;
};

export const getTaskStats = async () => {
  const response = await api.get('/tasks/stats');
  return response.data;
};

export const incrementPomodoro = async (taskId) => {
  const response = await api.post(`/tasks/${taskId}/pomodoro`);
  return response.data;
};

export const getTaskById = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};
