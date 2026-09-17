const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sql, poolPromise } = require('../config/database');
const authService = require('../services/authService');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Handle successful OAuth login
 * Generates tokens and redirects to frontend
 */
const handleOAuthSuccess = async (req, res) => {
  try {
    const user = req.user;
    
    // Safety check
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=OAuthFailed`);
    }

    const pool = await poolPromise;

    // Generate Access Token
    const accessToken = jwt.sign(
      { userId: user.id || user.userId, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const hashedToken = authService.hashRefreshToken(refreshToken);

    // Calculate expiration date for refresh token
    const expiresInStr = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const days = parseInt(expiresInStr.replace('d', '')) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Store the hashed token in the database
    await pool.request()
      .input('user_id', sql.Int, user.id || user.userId)
      .input('hashed_token', sql.NVarChar(512), hashedToken)
      .input('expires_at', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO RefreshTokens (user_id, hashed_token, expires_at)
        VALUES (@user_id, @hashed_token, @expires_at)
      `);

    // Set Refresh Token Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Redirect to frontend with access token in URL fragment or query
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${accessToken}`);

  } catch (error) {
    console.error('OAuth Success Handler Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=OAuthServerError`);
  }
};

// ==========================================
// Google OAuth Routes
// ==========================================
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=GoogleAuthFailed` }),
  handleOAuthSuccess
);

// ==========================================
// GitHub OAuth Routes
// ==========================================
router.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=GithubAuthFailed` }),
  handleOAuthSuccess
);

module.exports = router;
