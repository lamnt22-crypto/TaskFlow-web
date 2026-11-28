const { query } = require('../config/database');

/**
 * Get user profile by ID
 * @param {number} userId - The ID of the user
 * @returns {Promise<Object|null>} - User profile without sensitive data
 */
const getUserProfile = async (userId) => {
  const result = await query(
    `
      SELECT
        id,
        username,
        email,
        avatar_url,
        theme_color,
        created_at,
        updated_at
      FROM Users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Update user profile
 * @param {number} userId - The ID of the user
 * @param {Object} data - Update data { username, email, avatar_url, theme_color }
 * @returns {Promise<Object>} - Updated user profile
 */
const updateUserProfile = async (userId, data) => {
  if (data.username || data.email) {
    const params = [userId];
    const conditions = [];

    if (data.username) {
      params.push(data.username);
      conditions.push(`username = $${params.length}`);
    }
    if (data.email) {
      params.push(data.email);
      conditions.push(`email = $${params.length}`);
    }

    const checkResult = await query(
      `SELECT id FROM Users WHERE id != $1 AND (${conditions.join(' OR ')})`,
      params
    );

    if (checkResult.rows.length > 0) {
      const error = new Error('Username or email already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  const params = [];
  const setClauses = [];

  if (data.username) {
    params.push(data.username);
    setClauses.push(`username = $${params.length}`);
  }
  if (data.email) {
    params.push(data.email);
    setClauses.push(`email = $${params.length}`);
  }
  if (data.avatar_url !== undefined) {
    params.push(data.avatar_url);
    setClauses.push(`avatar_url = $${params.length}`);
  }
  if (data.theme_color !== undefined) {
    params.push(data.theme_color);
    setClauses.push(`theme_color = $${params.length}`);
  }

  if (setClauses.length > 0) {
    setClauses.push('updated_at = NOW()');
    params.push(userId);
    await query(
      `UPDATE Users SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
      params
    );
  }

  return getUserProfile(userId);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
