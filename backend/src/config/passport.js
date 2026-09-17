const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const authService = require('../services/authService');

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    callbackURL: '/api/oauth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await authService.findOrCreateOAuthUser(profile, 'google');
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'placeholder',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder',
    callbackURL: '/api/oauth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await authService.findOrCreateOAuthUser(profile, 'github');
      return done(null, user);
    } catch (error) {
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
