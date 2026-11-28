const { query } = require('../config/database');

const getCategories = async (userId) => {
  const result = await query(
    `
      SELECT id, user_id, name, color, created_at
      FROM Categories
      WHERE user_id = $1
      ORDER BY created_at ASC
    `,
    [userId]
  );

  return result.rows;
};

const createCategory = async (userId, name, color) => {
  if (color) {
    const result = await query(
      `
        INSERT INTO Categories (user_id, name, color)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, name, color, created_at
      `,
      [userId, name, color]
    );
    return result.rows[0];
  }

  const result = await query(
    `
      INSERT INTO Categories (user_id, name)
      VALUES ($1, $2)
      RETURNING id, user_id, name, color, created_at
    `,
    [userId, name]
  );
  return result.rows[0];
};

const updateCategory = async (userId, categoryId, name, color) => {
  const checkResult = await query(
    'SELECT id FROM Categories WHERE id = $1 AND user_id = $2',
    [categoryId, userId]
  );

  if (checkResult.rows.length === 0) {
    throw { statusCode: 404, message: 'Category not found or access denied' };
  }

  const params = [name];
  let updateFields = 'name = $1';

  if (color) {
    params.push(color);
    updateFields += `, color = $${params.length}`;
  }

  params.push(categoryId, userId);
  const idIdx = params.length - 1;
  const userIdx = params.length;

  const result = await query(
    `
      UPDATE Categories
      SET ${updateFields}
      WHERE id = $${idIdx} AND user_id = $${userIdx}
      RETURNING id, user_id, name, color, created_at
    `,
    params
  );

  return result.rows[0];
};

const deleteCategory = async (userId, categoryId) => {
  const checkResult = await query(
    'SELECT id FROM Categories WHERE id = $1 AND user_id = $2',
    [categoryId, userId]
  );

  if (checkResult.rows.length === 0) {
    throw { statusCode: 404, message: 'Category not found or access denied' };
  }

  try {
    await query('DELETE FROM Categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
  } catch (error) {
    if (error.code === '23503') {
      throw { statusCode: 409, message: 'Cannot delete category because it is used by one or more tasks' };
    }
    throw error;
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
