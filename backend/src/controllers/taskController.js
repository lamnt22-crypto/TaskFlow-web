const taskService = require('../services/taskService');
const { sql, poolPromise } = require('../config/database');

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const filters = {
      search: req.query.search,
      status: req.query.status,
      priority: req.query.priority,
      categoryId: req.query.categoryId,
      dueDate: req.query.dueDate,
      sort: req.query.sort
    };
    
    const tasks = await taskService.getTasks(userId, filters);
    
    return res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const stats = await taskService.getTaskStats(userId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id, 10);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    
    const task = await taskService.getTaskById(userId, taskId);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }
    
    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let { title, description, categoryId, status, priority, dueDate } = req.body;
    
    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    title = title.trim();
    if (title.length > 255) {
      return res.status(400).json({ success: false, message: 'Title is too long (max 255)' });
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }
    
    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid due date format' });
      }
    }
    
    const data = {
      title,
      description: description ? description.toString() : null,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: parsedDueDate
    };
    
    const task = await taskService.createTask(userId, data);
    
    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id, 10);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    
    let { title, description, categoryId, status, priority, dueDate } = req.body;
    
    const data = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      }
      data.title = title.trim();
      if (data.title.length > 255) {
        return res.status(400).json({ success: false, message: 'Title is too long (max 255)' });
      }
    }
    
    if (description !== undefined) {
      data.description = description === null ? null : description.toString();
    }
    
    if (categoryId !== undefined) {
      data.categoryId = categoryId === null ? null : parseInt(categoryId, 10);
    }
    
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      data.status = status;
    }
    
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority' });
      }
      data.priority = priority;
    }
    
    if (dueDate !== undefined) {
      if (dueDate === null) {
        data.dueDate = null;
      } else {
        const parsed = new Date(dueDate);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid due date format' });
        }
        data.dueDate = parsed;
      }
    }
    
    const task = await taskService.updateTask(userId, taskId, data);
    
    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id, 10);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    
    await taskService.deleteTask(userId, taskId);
    
    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateSubtask = async (req, res, next) => {
  try {
    const subtaskId = parseInt(req.params.id, 10);
    const { is_completed } = req.body;
    const userId = req.user.userId || req.user.id;

    if (isNaN(subtaskId)) {
      return res.status(400).json({ success: false, message: 'Invalid subtask ID' });
    }

    const pool = await poolPromise;
    // Verify ownership indirectly via Tasks table
    const checkResult = await pool.request()
      .input('subtaskId', sql.Int, subtaskId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT s.id 
        FROM Subtasks s 
        JOIN Tasks t ON s.task_id = t.id 
        WHERE s.id = @subtaskId AND t.user_id = @userId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this subtask' });
    }

    await pool.request()
      .input('subtaskId', sql.Int, subtaskId)
      .input('isCompleted', sql.Bit, is_completed ? 1 : 0)
      .query('UPDATE Subtasks SET is_completed = @isCompleted, updated_at = GETDATE() WHERE id = @subtaskId');

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const incrementPomodoro = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id, 10);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    
    await taskService.incrementPomodoro(userId, taskId);
    
    return res.status(200).json({ success: true, message: 'Pomodoro counted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  updateSubtask,
  deleteTask,
  incrementPomodoro
};
