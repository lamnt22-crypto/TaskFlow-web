import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthToken, setAuthExpiredHandler } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) setAuthToken(savedToken);
    return savedToken;
  });
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!accessToken;

  // Automatically sync user state changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    // Register the callback so api.js can notify us when the refresh token expires
    setAuthExpiredHandler(() => {
      setUser(null);
      setAccessToken(null);
      setAuthToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    });

    // Cleanup on unmount
    return () => {
      setAuthExpiredHandler(null);
    };
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      const { data: userData, accessToken: token } = response.data;
      setUser(userData);
      setAccessToken(token);
      setAuthToken(token); // Update the Axios token source
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', token);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = useCallback(async (token) => {
    setLoading(true);
    try {
      setAuthToken(token); // Set for API calls
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      setUser(userData);
      setAccessToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', token);
      return { success: true };
    } catch (error) {
      console.error('OAuth token login failed:', error);
      setAuthToken(null);
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = async (userData) => {
    setLoading(true);
    try {
      await api.post('/auth/register', userData);
      // Registration successful, but doesn't return token. User needs to login or we can return success.
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setAuthToken(null); // Clear the Axios token source
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  const loginGoogleFirebase = async () => {
    setLoading(true);
    try {
      const { loginWithFirebaseGoogle } = await import('../services/firebaseAuth');
      const res = await loginWithFirebaseGoogle();
      if (res.success) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginGithubFirebase = async () => {
    setLoading(true);
    try {
      const { loginWithFirebaseGithub } = await import('../services/firebaseAuth');
      const res = await loginWithFirebaseGithub();
      if (res.success) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        isAuthenticated,
        loading,
        login,
        loginWithToken,
        loginGoogleFirebase,
        loginGithubFirebase,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
