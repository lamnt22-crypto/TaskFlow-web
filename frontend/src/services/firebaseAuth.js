import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import api, { setAuthToken } from './api';

/**
 * Sign in using Firebase Google Popup and sync session with backend
 */
export const loginWithFirebaseGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const response = await api.post('/auth/firebase-login', {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      provider: 'google'
    });

    const { accessToken, data: userData } = response.data;
    if (accessToken) {
      setAuthToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }

    return { success: true, user: userData, accessToken };
  } catch (error) {
    console.error('Firebase Google Auth Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Google login failed' 
    };
  }
};

/**
 * Sign in using Firebase GitHub Popup and sync session with backend
 */
export const loginWithFirebaseGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const fbUser = result.user;

    const response = await api.post('/auth/firebase-login', {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      provider: 'github'
    });

    const { accessToken, data: userData } = response.data;
    if (accessToken) {
      setAuthToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }

    return { success: true, user: userData, accessToken };
  } catch (error) {
    console.error('Firebase GitHub Auth Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'GitHub login failed' 
    };
  }
};
