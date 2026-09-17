import axios from 'axios';

let currentAccessToken = null;
let refreshPromise = null;

export const setAuthToken = (token) => {
  currentAccessToken = token;
};

let authExpiredHandler = null;

export const setAuthExpiredHandler = (callback) => {
  authExpiredHandler = callback;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401, not already retried, and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh-token'
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        // Start a single refresh operation for all concurrent requests
        refreshPromise = api
          .post('/auth/refresh-token')
          .then((res) => {
            const newAccessToken = res.data.accessToken;
            setAuthToken(newAccessToken);
            return newAccessToken;
          })
          .catch((refreshError) => {
            // Refresh failed: clear token and reject
            setAuthToken(null);
            if (authExpiredHandler) {
              authExpiredHandler();
            }
            return Promise.reject(refreshError);
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const newAccessToken = await refreshPromise;
        // Update the original request's Authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
