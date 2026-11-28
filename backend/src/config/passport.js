const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const authService = require('../services/authService');

const isProd = (process.env.NODE_ENV || '').trim() === 'production';
const backendUrl = (
  process.env.BACKEND_URL ||
  (isProd ? 'https://taskflow-backend-ct0e.onrender.com' : 'http://localhost:5000')
).trim().replace(/\/+$/, '');

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: (process.env.GOOGLE_CLIENT_ID || 'placeholder').trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || 'placeholder').trim(),
    callbackURL: `${backendUrl}/api/oauth/google/callback`,
    proxy: true,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await authService.findOrCreateOAuthUser(profile, 'google');
      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth findOrCreateOAuthUser Error:', error);
      return done(error, false);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: (process.env.GITHUB_CLIENT_ID || 'placeholder').trim(),
    clientSecret: (process.env.GITHUB_CLIENT_SECRET || 'placeholder').trim(),
    callbackURL: `${backendUrl}/api/oauth/github/callback`,
    proxy: true,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await authService.findOrCreateOAuthUser(profile, 'github');
      return done(null, user);
    } catch (error) {
      console.error('❌ GitHub OAuth findOrCreateOAuthUser Error:', error);
      return done(error, false);
    }
  }
));

// We are using JWT, so we don't strictly need to serialize/deserialize user into session,
// but passport requires it if session: true is used (which is default for OAuth flows before our custom callback logic).
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
