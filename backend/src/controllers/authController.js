const authService = require('../services/authService');
const userService = require('../services/userService');

const register = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }
    
    username = username.trim();
    email = email.trim().toLowerCase();
    
    // Basic email format validation
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
      data: user
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
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    };
    
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result.user,
      accessToken: result.accessToken
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
      accessToken: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    
    // Call logout safely; if missing/invalid, it does not throw
    await authService.logoutUser(rawRefreshToken);
    
    res.clearCookie('refreshToken', { path: '/api/auth' });
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // Fetch full user profile instead of just returning JWT payload
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
        theme_color: user.theme_color
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};
