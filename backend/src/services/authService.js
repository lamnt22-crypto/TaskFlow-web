const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sql, poolPromise } = require('../config/database');

/**
 * Hash a raw token using SHA-256 for secure database storage.
 */
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const registerUser = async (username, email, password) => {
  const pool = await poolPromise;
  
  // Check for duplicate username or email
  const checkResult = await pool.request()
    .input('username', sql.NVarChar(50), username)
    .input('email', sql.NVarChar(100), email)
    .query('SELECT id, username, email FROM Users WHERE username = @username OR email = @email');
  
  if (checkResult.recordset.length > 0) {
    const existing = checkResult.recordset[0];
    if (existing.username === username) throw { statusCode: 409, message: 'Username already exists' };
    if (existing.email === email) throw { statusCode: 409, message: 'Email already exists' };
  }
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Insert the new user
  const insertResult = await pool.request()
    .input('username', sql.NVarChar(50), username)
    .input('email', sql.NVarChar(100), email)
    .input('password_hash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO Users (username, email, password_hash)
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.email
      VALUES (@username, @email, @password_hash)
    `);
    
  return insertResult.recordset[0];
};

const loginUser = async (email, password) => {
  const pool = await poolPromise;
  
  // Find the user by email
  const userResult = await pool.request()
    .input('email', sql.NVarChar(100), email)
    .query('SELECT id, username, email, password_hash, avatar_url, theme_color FROM Users WHERE email = @email');
    
  const user = userResult.recordset[0];
  if (!user) throw { statusCode: 401, message: 'Invalid credentials' };
  
  // Compare the password hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw { statusCode: 401, message: 'Invalid credentials' };
  
  const safeUser = { 
    userId: user.id, 
    username: user.username, 
    email: user.email,
    avatar_url: user.avatar_url,
    theme_color: user.theme_color
  };
  
  // Generate Access Token
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  
  // Generate a random string for the refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = hashRefreshToken(refreshToken);
  
  // Calculate expiration date
  const expiresInStr = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const days = parseInt(expiresInStr.replace('d', '')) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  
  // Store the hashed token in the database
  await pool.request()
    .input('user_id', sql.Int, user.id)
    .input('hashed_token', sql.NVarChar(512), hashedToken)
    .input('expires_at', sql.DateTime, expiresAt)
    .query(`
      INSERT INTO RefreshTokens (user_id, hashed_token, expires_at)
      VALUES (@user_id, @hashed_token, @expires_at)
    `);
    
  return { accessToken, refreshToken, user: safeUser };
};

const refreshAccessToken = async (rawRefreshToken) => {
  const pool = await poolPromise;
  const hashedToken = hashRefreshToken(rawRefreshToken);
  
  const tokenResult = await pool.request()
    .input('hashed_token', sql.NVarChar(512), hashedToken)
    .query(`
      SELECT user_id, expires_at 
      FROM RefreshTokens 
      WHERE hashed_token = @hashed_token
    `);
    
  const record = tokenResult.recordset[0];
  if (!record) throw { statusCode: 401, message: 'Invalid or missing refresh token' };
  
  if (new Date() > new Date(record.expires_at)) {
    // Proactively delete expired token
    await pool.request()
      .input('hashed_token', sql.NVarChar(512), hashedToken)
      .query('DELETE FROM RefreshTokens WHERE hashed_token = @hashed_token');
    throw { statusCode: 401, message: 'Refresh token expired' };
  }
  
  // Find user to issue new token
  const userResult = await pool.request()
    .input('id', sql.Int, record.user_id)
    .query('SELECT id, email FROM Users WHERE id = @id');
    
  const user = userResult.recordset[0];
  if (!user) throw { statusCode: 401, message: 'User not found' };
  
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  
  return { accessToken };
};

const logoutUser = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const pool = await poolPromise;
  const hashedToken = hashRefreshToken(rawRefreshToken);
  
  // Delete the token to invalidate it
  await pool.request()
    .input('hashed_token', sql.NVarChar(512), hashedToken)
    .query('DELETE FROM RefreshTokens WHERE hashed_token = @hashed_token');
};

/**
 * Find or create a user from an OAuth profile
 */
const findOrCreateOAuthUser = async (profile, provider) => {
  const pool = await poolPromise;
  
  const idField = provider === 'google' ? 'google_id' : 'github_id';
  const profileId = profile.id;
  let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
  const displayName = profile.displayName || profile.username || 'OAuth User';
  const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

  // 1. Try to find by provider ID
  const providerResult = await pool.request()
    .input('profileId', sql.NVarChar(255), profileId)
    .query(`SELECT id, username, email, avatar_url, theme_color FROM Users WHERE ${idField} = @profileId`);
    
  if (providerResult.recordset.length > 0) {
    return providerResult.recordset[0]; // User found by provider ID
  }

  // 2. Try to find by email
  if (email) {
    const emailResult = await pool.request()
      .input('email', sql.NVarChar(100), email)
      .query(`SELECT id, username, email, avatar_url, theme_color, ${idField} FROM Users WHERE email = @email`);
      
    if (emailResult.recordset.length > 0) {
      const existingUser = emailResult.recordset[0];
      
      // Link the provider ID to this existing account
      await pool.request()
        .input('userId', sql.Int, existingUser.id)
        .input('profileId', sql.NVarChar(255), profileId)
        .query(`UPDATE Users SET ${idField} = @profileId WHERE id = @userId`);
        
      return existingUser;
    }
  } else {
     // Fallback if no email is provided (common with GitHub if email is private)
     email = `${profileId}@${provider}.local`;
  }

  // 3. Create a new user
  // We'll generate a random password hash since password is required by schema (wait, we altered it to be NULL)
  // Since password_hash is NULL, we don't pass it.
  
  const insertResult = await pool.request()
    .input('username', sql.NVarChar(50), displayName.substring(0, 50))
    .input('email', sql.NVarChar(100), email)
    .input('avatar_url', sql.NVarChar(255), avatarUrl)
    .input('profileId', sql.NVarChar(255), profileId)
    .query(`
      INSERT INTO Users (username, email, avatar_url, ${idField})
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.avatar_url, INSERTED.theme_color
      VALUES (@username, @email, @avatar_url, @profileId)
    `);
    
  return insertResult.recordset[0];
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  findOrCreateOAuthUser,
  hashRefreshToken // Exported for the OAuth controller to use
};
