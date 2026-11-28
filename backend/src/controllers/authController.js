const authService = require('../services/authService');
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const { getJwtAccessSecret, getJwtExpiresIn } = require('../config/jwt');

const getRefreshCookieOptions = (days = 7) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
};

const register = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await authService.registerUser(username, email, password);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await authService.loginUser(email.trim().toLowerCase(), password);
    res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions(7));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const result = await authService.refreshAccessToken(rawRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    await authService.logoutUser(rawRefreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      path: '/api/auth',
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.userId || req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        theme_color: user.theme_color,
      },
    });
  } catch (error) {
    next(error);
  }
};

const firebaseLogin = async (req, res, next) => {
  try {
    const { uid, email, displayName, photoURL, provider = 'google' } = req.body;
    if (!uid) {
      return res.status(400).json({ success: false, message: 'UID is required' });
    }

    const profile = {
      id: uid,
      displayName: displayName || (email ? email.split('@')[0] : 'Firebase User'),
      emails: email ? [{ value: email }] : [],
      photos: photoURL ? [{ value: photoURL }] : [],
    };

    const user = await authService.findOrCreateOAuthUser(profile, provider);
    const userId = user.id || user.userId;

    const accessToken = jwt.sign(
      { userId, email: user.email },
      getJwtAccessSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    const { refreshToken: rawRefresh, days } = await authService.createRefreshToken(userId);
    res.cookie('refreshToken', rawRefresh, getRefreshCookieOptions(days));

    return res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      accessToken,
      data: {
        userId,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        theme_color: user.theme_color,
      },
    });
  } catch (error) {
    console.error('Firebase Login Controller Error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  firebaseLogin,
};
