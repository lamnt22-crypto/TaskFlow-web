const { sql, poolPromise } = require('../config/database');

const getCategories = async (userId) => {
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .query(`
      SELECT id, user_id, name, color, created_at 
      FROM Categories 
      WHERE user_id = @user_id 
      ORDER BY created_at ASC
    `);
    
  return result.recordset;
};

const createCategory = async (userId, name, color) => {
  const pool = await poolPromise;
  
  const request = pool.request()
    .input('user_id', sql.Int, userId)
    .input('name', sql.NVarChar(100), name);
    
  let query = `
    INSERT INTO Categories (user_id, name)
    OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.name, INSERTED.color, INSERTED.created_at
    VALUES (@user_id, @name)
  `;

  if (color) {
    request.input('color', sql.NVarChar(20), color);
    query = `
      INSERT INTO Categories (user_id, name, color)
      OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.name, INSERTED.color, INSERTED.created_at
      VALUES (@user_id, @name, @color)
    `;
  }
  
  const result = await request.query(query);
  return result.recordset[0];
};

const updateCategory = async (userId, categoryId, name, color) => {
  const pool = await poolPromise;
  
  // Verify ownership and existence
  const checkResult = await pool.request()
    .input('id', sql.Int, categoryId)
    .input('user_id', sql.Int, userId)
    .query('SELECT id FROM Categories WHERE id = @id AND user_id = @user_id');
    
  if (checkResult.recordset.length === 0) {
    throw { statusCode: 404, message: 'Category not found or access denied' };
  }
  
  const request = pool.request()
    .input('id', sql.Int, categoryId)
    .input('user_id', sql.Int, userId)
    .input('name', sql.NVarChar(100), name);
    
  let updateFields = 'name = @name';
  if (color) {
    request.input('color', sql.NVarChar(20), color);
    updateFields += ', color = @color';
  }
  
  const result = await request.query(`
    UPDATE Categories 
    SET ${updateFields} 
    OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.name, INSERTED.color, INSERTED.created_at
    WHERE id = @id AND user_id = @user_id
  `);
  
  return result.recordset[0];
};

const deleteCategory = async (userId, categoryId) => {
  const pool = await poolPromise;
  
  // Verify ownership and existence
  const checkResult = await pool.request()
    .input('id', sql.Int, categoryId)
    .input('user_id', sql.Int, userId)
    .query('SELECT id FROM Categories WHERE id = @id AND user_id = @user_id');
    
  if (checkResult.recordset.length === 0) {
    throw { statusCode: 404, message: 'Category not found or access denied' };
  }
  
  try {
    await pool.request()
      .input('id', sql.Int, categoryId)
      .input('user_id', sql.Int, userId)
      .query('DELETE FROM Categories WHERE id = @id AND user_id = @user_id');
  } catch (error) {
    // SQL Server error 547 is constraint violation
    if (error.number === 547) {
      throw { statusCode: 409, message: 'Cannot delete category because it is used by one or more tasks' };
    }
    throw error;
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
