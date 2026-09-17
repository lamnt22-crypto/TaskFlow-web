const { poolPromise } = require('../config/database');
const sql = require('mssql');

/**
 * Get user profile by ID
 * @param {number} userId - The ID of the user
 * @returns {Promise<Object|null>} - User profile without sensitive data
 */
const getUserProfile = async (userId) => {
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT 
        id,
        username,
        email,
        avatar_url,
        theme_color,
        created_at,
        updated_at
      FROM Users
      WHERE id = @userId
    `);
    
  return result.recordset[0] || null;
};

/**
 * Update user profile
 * @param {number} userId - The ID of the user
 * @param {Object} data - Update data { username, email }
 * @returns {Promise<Object>} - Updated user profile
 */
const updateUserProfile = async (userId, data) => {
  const pool = await poolPromise;
  
  // First verify if email or username already exists for a DIFFERENT user
  if (data.username || data.email) {
    const checkReq = pool.request().input('userId', sql.Int, userId);
    let checkQuery = 'SELECT id FROM Users WHERE id != @userId AND (';
    const conditions = [];
    
    if (data.username) {
      checkReq.input('username', sql.NVarChar(255), data.username);
      conditions.push('username = @username');
    }
    
    if (data.email) {
      checkReq.input('email', sql.NVarChar(255), data.email);
      conditions.push('email = @email');
    }
    
    checkQuery += conditions.join(' OR ') + ')';
    
    const checkResult = await checkReq.query(checkQuery);
    
    if (checkResult.recordset.length > 0) {
      const error = new Error('Username or email already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  // Update query
  const updateReq = pool.request().input('userId', sql.Int, userId);
  const setClauses = [];
  
  if (data.username) {
    updateReq.input('username', sql.NVarChar(255), data.username);
    setClauses.push('username = @username');
  }
  
  if (data.email) {
    updateReq.input('email', sql.NVarChar(255), data.email);
    setClauses.push('email = @email');
  }

  if (data.avatar_url !== undefined) {
    updateReq.input('avatar_url', sql.NVarChar(255), data.avatar_url);
    setClauses.push('avatar_url = @avatar_url');
  }

  if (data.theme_color !== undefined) {
    updateReq.input('theme_color', sql.NVarChar(50), data.theme_color);
    setClauses.push('theme_color = @theme_color');
  }
  
  // Always update updated_at if we are changing anything
  if (setClauses.length > 0) {
    setClauses.push('updated_at = GETDATE()');
    
    const updateQuery = `
      UPDATE Users
      SET ${setClauses.join(', ')}
      WHERE id = @userId
    `;
    
    await updateReq.query(updateQuery);
  }
  
  // Return the fresh data
  return getUserProfile(userId);
};

module.exports = {
  getUserProfile,
  updateUserProfile
};
