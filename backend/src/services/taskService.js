const { sql, poolPromise } = require('../config/database');
const gamificationService = require('./gamificationService');

const parseSubtasks = (recordset) => {
  return recordset.map(task => {
    if (task.subtasks) {
      try {
        task.subtasks = JSON.parse(task.subtasks);
        // Ensure boolean is true/false (SQL Server bit might come out as 1/0 inside JSON string sometimes depending on parser, but usually true/false)
        task.subtasks = task.subtasks.map(s => ({
          ...s,
          is_completed: s.is_completed === true || s.is_completed === 1
        }));
      } catch(e) {
        task.subtasks = [];
      }
    } else {
      task.subtasks = [];
    }
    return task;
  });
};

const getTasks = async (userId, filters = {}) => {
  const pool = await poolPromise;
  
  let query = `
    SELECT 
      id, user_id, category_id, title, description, status, priority, due_date, created_at, updated_at,
      (SELECT id, title, is_completed, created_at FROM Subtasks WHERE task_id = Tasks.id ORDER BY id ASC FOR JSON PATH) as subtasks
    FROM Tasks 
    WHERE user_id = @userId
  `;
  const request = pool.request().input('userId', sql.Int, userId);
  
  if (filters.search) {
    query += ' AND (title LIKE @search OR description LIKE @search)';
    request.input('search', sql.NVarChar, `%${filters.search}%`);
  }
  
  if (filters.status) {
    query += ' AND status = @status';
    request.input('status', sql.NVarChar(20), filters.status);
  }
  
  if (filters.priority) {
    query += ' AND priority = @priority';
    request.input('priority', sql.NVarChar(20), filters.priority);
  }
  
  if (filters.categoryId) {
    query += ' AND category_id = @categoryId';
    request.input('categoryId', sql.Int, parseInt(filters.categoryId, 10));
  }
  
  if (filters.dueDate) {
    if (filters.dueDate === 'today') {
      query += " AND CAST(due_date AS DATE) = CAST(GETDATE() AS DATE)";
    } else if (filters.dueDate === 'upcoming') {
      query += " AND CAST(due_date AS DATE) > CAST(GETDATE() AS DATE) AND status != 'COMPLETED'";
    } else if (filters.dueDate === 'overdue') {
      query += " AND CAST(due_date AS DATE) < CAST(GETDATE() AS DATE) AND status != 'COMPLETED'";
    }
  }
  
  if (filters.sort) {
    const validSorts = {
      'dueDateAsc': 'due_date ASC',
      'dueDateDesc': 'due_date DESC',
      'createdAtAsc': 'created_at ASC',
      'createdAtDesc': 'created_at DESC',
      'priorityDesc': "CASE priority WHEN 'URGENT' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END DESC"
    };
    if (validSorts[filters.sort]) {
      query += ` ORDER BY ${validSorts[filters.sort]}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const result = await request.query(query);
  return parseSubtasks(result.recordset);
};

const getTaskStats = async (userId) => {
  const pool = await poolPromise;
  
  const query = `
    SELECT 
      COUNT(id) as total_tasks,
      SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as todo_tasks,
      SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN status != 'COMPLETED' AND CAST(due_date AS DATE) < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) as overdue_tasks,
      SUM(CASE WHEN CAST(due_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) as today_tasks
    FROM Tasks
    WHERE user_id = @userId
  `;
  
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(query);
    
  const stats = result.recordset[0];
  
  // Pomodoro Stats by Category
  const pomodoroQuery = `
    SELECT 
      c.name as name, 
      c.color as color, 
      SUM(t.pomodoro_count) as value 
    FROM Tasks t
    JOIN Categories c ON t.category_id = c.id
    WHERE t.user_id = @userId AND t.pomodoro_count > 0
    GROUP BY c.id, c.name, c.color
  `;
  const pomodoroResult = await pool.request()
    .input('userId', sql.Int, userId)
    .query(pomodoroQuery);
  
  const formattedStats = {
    totalTasks: stats.total_tasks || 0,
    todoTasks: stats.todo_tasks || 0,
    inProgressTasks: stats.in_progress_tasks || 0,
    completedTasks: stats.completed_tasks || 0,
    overdueTasks: stats.overdue_tasks || 0,
    todayTasks: stats.today_tasks || 0,
    completionRate: stats.total_tasks > 0 
      ? Math.round(((stats.completed_tasks || 0) / stats.total_tasks) * 100) 
      : 0,
    categoryPomodoros: pomodoroResult.recordset || []
  };
  
  return formattedStats;
};

const getTaskById = async (userId, taskId) => {
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('taskId', sql.Int, taskId)
    .query(`
      SELECT 
        id, user_id, category_id, title, description, status, priority, due_date, created_at, updated_at,
        (SELECT id, title, is_completed, created_at FROM Subtasks WHERE task_id = Tasks.id ORDER BY id ASC FOR JSON PATH) as subtasks
      FROM Tasks 
      WHERE id = @taskId AND user_id = @userId
    `);
    
  if (result.recordset.length === 0) return null;
  return parseSubtasks(result.recordset)[0];
};

const createTask = async (userId, data) => {
  const pool = await poolPromise;
  let transaction;
  
  try {
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('title', sql.NVarChar(255), data.title)
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('categoryId', sql.Int, data.categoryId || null)
      .input('status', sql.NVarChar(20), data.status || 'TODO')
      .input('priority', sql.NVarChar(20), data.priority || 'MEDIUM')
      .input('dueDate', sql.DateTime, data.dueDate || null);
      
    const query = `
      INSERT INTO Tasks (user_id, category_id, title, description, status, priority, due_date)
      OUTPUT INSERTED.id
      VALUES (@userId, @categoryId, @title, @description, @status, @priority, @dueDate)
    `;
    
    const result = await request.query(query);
    const newTaskId = result.recordset[0].id;

    // Handle Subtasks creation if provided
    if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
      for (const subtask of data.subtasks) {
        if (!subtask.title) continue;
        const subReq = new sql.Request(transaction)
          .input('taskId', sql.Int, newTaskId)
          .input('title', sql.NVarChar(255), subtask.title)
          .input('isCompleted', sql.Bit, subtask.is_completed ? 1 : 0);
        await subReq.query(`INSERT INTO Subtasks (task_id, title, is_completed) VALUES (@taskId, @title, @isCompleted)`);
      }
    }

    await transaction.commit();
    
    // Fetch and return the fully constructed task
    return await getTaskById(userId, newTaskId);
  } catch (error) {
    if (transaction) await transaction.rollback();
    if (error.number === 547) {
      throw { statusCode: 404, message: 'Category not found or category not owned by user' };
    }
    throw error;
  }
};

const updateTask = async (userId, taskId, data) => {
  const pool = await poolPromise;
  
  // Verify ownership
  const task = await getTaskById(userId, taskId);
  if (!task) {
    throw { statusCode: 404, message: 'Task not found or access denied' };
  }
  
  let transaction;
  try {
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('taskId', sql.Int, taskId)
      .input('title', sql.NVarChar(255), data.title !== undefined ? data.title : task.title)
      .input('description', sql.NVarChar(sql.MAX), data.description !== undefined ? data.description : task.description)
      .input('categoryId', sql.Int, data.categoryId !== undefined ? data.categoryId : task.category_id)
      .input('status', sql.NVarChar(20), data.status !== undefined ? data.status : task.status)
      .input('priority', sql.NVarChar(20), data.priority !== undefined ? data.priority : task.priority)
      .input('dueDate', sql.DateTime, data.dueDate !== undefined ? data.dueDate : task.due_date);
      
    const query = `
      UPDATE Tasks 
      SET 
        title = @title,
        description = @description,
        category_id = @categoryId,
        status = @status,
        priority = @priority,
        due_date = @dueDate,
        updated_at = GETDATE()
      WHERE id = @taskId AND user_id = @userId
    `;
    
    await request.query(query);

    // Sync subtasks if provided in payload
    if (data.subtasks !== undefined && Array.isArray(data.subtasks)) {
      // 1. Delete removed subtasks
      const existingIds = data.subtasks.filter(st => st.id).map(st => st.id);
      let deleteQuery = `DELETE FROM Subtasks WHERE task_id = @taskId`;
      const delReq = new sql.Request(transaction).input('taskId', sql.Int, taskId);
      if (existingIds.length > 0) {
        deleteQuery += ` AND id NOT IN (${existingIds.join(',')})`;
      }
      await delReq.query(deleteQuery);

      // 2. Update existing & Insert new
      for (const st of data.subtasks) {
        if (!st.title) continue;
        const subReq = new sql.Request(transaction)
          .input('taskId', sql.Int, taskId)
          .input('title', sql.NVarChar(255), st.title)
          .input('isCompleted', sql.Bit, st.is_completed ? 1 : 0);
          
        if (st.id) {
          subReq.input('subId', sql.Int, st.id);
          await subReq.query(`UPDATE Subtasks SET title = @title, is_completed = @isCompleted, updated_at = GETDATE() WHERE id = @subId AND task_id = @taskId`);
        } else {
          await subReq.query(`INSERT INTO Subtasks (task_id, title, is_completed) VALUES (@taskId, @title, @isCompleted)`);
        }
      }
    }

    // Auto-complete logic for parent task
    // (If the user wants parent to be COMPLETED when all subtasks are COMPLETED, we could do it here. For now, leaving as requested or manual)

    // Gamification Logic
    let gamificationStats = null;
    if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
        gamificationStats = await gamificationService.recordTaskCompletion(userId, transaction);
    }

    await transaction.commit();
    
    const updatedTask = await getTaskById(userId, taskId);
    if (gamificationStats) {
        updatedTask.gamification = gamificationStats;
        
        // Check if all tasks today are completed
        const stats = await getTaskStats(userId);
        if (stats.todoTasks === 0 && stats.inProgressTasks === 0 && stats.completedTasks > 0) {
            updatedTask.gamification.allCompleted = true;
        }
    }
    
    return updatedTask;
  } catch (error) {
    if (transaction) await transaction.rollback();
    if (error.number === 547) {
      throw { statusCode: 404, message: 'Category not found or category not owned by user' };
    }
    throw error;
  }
};

const deleteTask = async (userId, taskId) => {
  const pool = await poolPromise;
  
  const checkResult = await pool.request()
    .input('userId', sql.Int, userId)
    .input('taskId', sql.Int, taskId)
    .query('SELECT id FROM Tasks WHERE id = @taskId AND user_id = @userId');
    
  if (checkResult.recordset.length === 0) {
    throw { statusCode: 404, message: 'Task not found or access denied' };
  }
  
  // Subtasks are deleted automatically due to ON DELETE CASCADE
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('taskId', sql.Int, taskId)
    .query('DELETE FROM Tasks WHERE id = @taskId AND user_id = @userId');
    
  return true;
};

const updateSubtask = async (userId, subtaskId, isCompleted) => {
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('subtaskId', sql.Int, subtaskId)
    .input('isCompleted', sql.Bit, isCompleted ? 1 : 0)
    .query(`
      UPDATE Subtasks
      SET is_completed = @isCompleted
      WHERE id = @subtaskId AND task_id IN (SELECT id FROM Tasks WHERE user_id = @userId)
    `);
    
  if (result.rowsAffected[0] === 0) {
    throw new Error('Subtask not found or access denied');
  }
  return true;
};

const incrementPomodoro = async (userId, taskId) => {
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('taskId', sql.Int, taskId)
    .query(`
      UPDATE Tasks 
      SET pomodoro_count = ISNULL(pomodoro_count, 0) + 1 
      WHERE id = @taskId AND user_id = @userId
    `);
    
  if (result.rowsAffected[0] === 0) {
    throw new Error('Task not found or access denied');
  }
  return true;
};

module.exports = {
  getTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateSubtask,
  incrementPomodoro
};
