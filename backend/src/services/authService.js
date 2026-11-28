const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { getJwtAccessSecret, getJwtExpiresIn } = require('../config/jwt');

/**
 * Hash a raw token using SHA-256 for secure database storage.
 */
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate and persist a refresh token for a user.
 */
const createRefreshToken = async (userId) => {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = hashRefreshToken(refreshToken);

  const expiresInStr = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const days = parseInt(expiresInStr.replace('d', ''), 10) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  await query(
    `INSERT INTO RefreshTokens (user_id, hashed_token, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashedToken, expiresAt]
  );

  return { refreshToken, days };
};

const registerUser = async (username, email, password) => {
  const checkResult = await query(
    'SELECT id, username, email FROM Users WHERE username = $1 OR email = $2',
    [username, email]
  );

  if (checkResult.rows.length > 0) {
    const existing = checkResult.rows[0];
    if (existing.username === username) throw { statusCode: 409, message: 'Username already exists' };
    if (existing.email === email) throw { statusCode: 409, message: 'Email already exists' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const insertResult = await query(
    `
      INSERT INTO Users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email
    `,
    [username, email, passwordHash]
  );

  return insertResult.rows[0];
};

const loginUser = async (email, password) => {
  const userResult = await query(
    'SELECT id, username, email, password_hash, avatar_url, theme_color FROM Users WHERE email = $1',
    [email]
  );

  const user = userResult.rows[0];
  if (!user || !user.password_hash) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw { statusCode: 401, message: 'Invalid credentials' };

  const safeUser = {
    userId: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    theme_color: user.theme_color,
  };

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    getJwtAccessSecret(),
    { expiresIn: getJwtExpiresIn() }
  );

  const { refreshToken } = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user: safeUser };
};

const refreshAccessToken = async (rawRefreshToken) => {
  const hashedToken = hashRefreshToken(rawRefreshToken);

  const tokenResult = await query(
    `SELECT user_id, expires_at FROM RefreshTokens WHERE hashed_token = $1`,
    [hashedToken]
  );

  const record = tokenResult.rows[0];
  if (!record) throw { statusCode: 401, message: 'Invalid or missing refresh token' };

  if (new Date() > new Date(record.expires_at)) {
    await query('DELETE FROM RefreshTokens WHERE hashed_token = $1', [hashedToken]);
    throw { statusCode: 401, message: 'Refresh token expired' };
  }

  const userResult = await query('SELECT id, email FROM Users WHERE id = $1', [record.user_id]);
  const user = userResult.rows[0];
  if (!user) throw { statusCode: 401, message: 'User not found' };

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    getJwtAccessSecret(),
    { expiresIn: getJwtExpiresIn() }
  );

  return { accessToken };
};

const logoutUser = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const hashedToken = hashRefreshToken(rawRefreshToken);
  await query('DELETE FROM RefreshTokens WHERE hashed_token = $1', [hashedToken]);
};

/**
 * Find or create a user from an OAuth profile
 */
const findOrCreateOAuthUser = async (profile, provider) => {
  const idField = provider === 'google' ? 'google_id' : 'github_id';
  const profileId = String(profile.id);
  let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
  const displayName = profile.displayName || profile.username || 'OAuth User';
  const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

  // 1. Try to find by provider ID
  const providerResult = await query(
    `SELECT id, username, email, avatar_url, theme_color FROM Users WHERE ${idField} = $1`,
    [profileId]
  );

  if (providerResult.rows.length > 0) {
    return providerResult.rows[0];
  }

  // 2. Try to find by email
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailResult = await query(
      `SELECT id, username, email, avatar_url, theme_color, ${idField} FROM Users WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );

    if (emailResult.rows.length > 0) {
      const existingUser = emailResult.rows[0];
      await query(`UPDATE Users SET ${idField} = $1, updated_at = NOW() WHERE id = $2`, [
        profileId,
        existingUser.id,
      ]);
      return existingUser;
    }
    email = normalizedEmail;
  } else {
    email = `${profileId}@${provider}.local`;
  }

  // 3. Create a new user with guaranteed unique username
  const baseUsername = (displayName || 'user').trim().replace(/[\r\n\t]/g, '').substring(0, 40) || 'user';
  let candidateUsername = baseUsername;
  let counter = 1;

  while (true) {
    const checkUser = await query('SELECT id FROM Users WHERE username = $1', [candidateUsername]);
    if (checkUser.rows.length === 0) {
      break;
    }
    const suffix = `_${Math.floor(1000 + Math.random() * 9000)}`;
    candidateUsername = `${baseUsername.substring(0, 50 - suffix.length)}${suffix}`;
    counter++;
    if (counter > 5) {
      candidateUsername = `user_${Date.now()}`;
      break;
    }
  }

  const safeAvatar = avatarUrl ? avatarUrl.substring(0, 1000) : null;

  const insertResult = await query(
    `
      INSERT INTO Users (username, email, avatar_url, ${idField})
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, avatar_url, theme_color
    `,
    [candidateUsername, email, safeAvatar, profileId]
  );

  return insertResult.rows[0];
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  findOrCreateOAuthUser,
  hashRefreshToken,
  createRefreshToken,
};
