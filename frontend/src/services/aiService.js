import api from './api';

export const breakdownTask = async (taskId, taskTitle, taskDescription) => {
  const response = await api.post('/ai/breakdown', { taskId, taskTitle, taskDescription });
  return response.data;
};

export const prioritizeTasks = async () => {
  const response = await api.get('/ai/prioritize');
  return response.data;
};

export const getChatHistory = async () => {
  const response = await api.get('/ai/chat');
  return response.data;
};

export const summarizeTask = async (taskId) => {
  const response = await api.post('/ai/summarize', { taskId });
  return response.data;
};

export const generatePlan = async (goal, audience, durationDays) => {
  const response = await api.post('/ai/generate-plan', { goal, audience, durationDays });
  return response.data;
};

export const generatePlanFromFile = async (formData) => {
  try {
    const response = await api.post('/ai/generate-plan-from-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error generating AI plan from file:', error);
    return { success: false, error: error.response?.data?.message || 'Failed to generate plan from file' };
  }
};

export const parseTaskFromText = async (text) => {
  const response = await api.post('/ai/parse-task', { text });
  return response.data;
};
