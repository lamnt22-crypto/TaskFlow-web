const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const { getJwtAccessSecret, getJwtExpiresIn } = require('../config/jwt');

const router = express.Router();

const isProd = (process.env.NODE_ENV || '').trim() === 'production';
const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  (isProd ? 'https://task-flow-web-self.vercel.app' : 'http://localhost:5173')
).trim().replace(/\/+$/, '');

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
      getJwtAccessSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    const { refreshToken, days } = await authService.createRefreshToken(userId);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.redirect(`${FRONTEND_URL}/oauth-success?token=${accessToken}`);
  } catch (error) {
    console.error('❌ OAuth Success Handler Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=OAuthServerError`);
  }
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('❌ Google OAuth Callback Error:', err);
      return res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed`);
    }
    if (!user) {
      console.warn('⚠️ Google OAuth No User:', info);
      return res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed`);
    }
    req.user = user;
    return handleOAuthSuccess(req, res);
  })(req, res, next);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      console.error('❌ GitHub OAuth Callback Error:', err);
      return res.redirect(`${FRONTEND_URL}/login?error=GithubAuthFailed`);
    }
    if (!user) {
      console.warn('⚠️ GitHub OAuth No User:', info);
      return res.redirect(`${FRONTEND_URL}/login?error=GithubAuthFailed`);
    }
    req.user = user;
    return handleOAuthSuccess(req, res);
  })(req, res, next);
});

module.exports = router;
