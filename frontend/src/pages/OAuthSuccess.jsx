import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Store token and update context
      loginWithToken(token);
      navigate('/dashboard');
    } else {
      // If no token, something went wrong
      navigate('/login?error=OAuthMissingToken');
    }
  }, [location, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center">
      <svg className="w-12 h-12 text-indigo-600 animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        Authenticating...
      </h2>
      <p className="text-zinc-500 mt-2">Please wait while we log you in.</p>
    </div>
  );
};

export default OAuthSuccess;
