import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/users/me', profileData);
  return response.data;
};

export const uploadAvatar = async (formData) => {
  const response = await api.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
