const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

const router = express.Router();

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

/**
 * Handle successful OAuth login
 * Generates tokens and redirects to frontend
 */
const handleOAuthSuccess = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=OAuthFailed`);
    }

    const userId = user.id || user.userId;
    const accessToken = jwt.sign(
      { userId, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    const { refreshToken, days } = await authService.createRefreshToken(userId);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.redirect(`${FRONTEND_URL}/oauth-success?token=${accessToken}`);
  } catch (error) {
    console.error('OAuth Success Handler Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=OAuthServerError`);
  }
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=GoogleAuthFailed` }),
  handleOAuthSuccess
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=GithubAuthFailed` }),
  handleOAuthSuccess
);

module.exports = router;
