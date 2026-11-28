const { query, withTransaction } = require('../config/database');
const gamificationService = require('./gamificationService');

const SUBTASKS_SUBQUERY = `
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', s.id,
          'title', s.title,
          'is_completed', s.is_completed,
          'created_at', s.created_at
        ) ORDER BY s.id ASC
      )
      FROM Subtasks s
      WHERE s.task_id = Tasks.id
    ),
    '[]'::json
  ) AS subtasks
`;

const parseSubtasks = (rows) => {
  return rows.map((task) => {
    let subtasks = task.subtasks;
    if (typeof subtasks === 'string') {
      try {
        subtasks = JSON.parse(subtasks);
      } catch (e) {
        subtasks = [];
      }
    }
    if (Array.isArray(subtasks)) {
      task.subtasks = subtasks.map((s) => ({
        ...s,
        is_completed: s.is_completed === true || s.is_completed === 1,
      }));
    } else {
      task.subtasks = [];
    }
    return task;
  });
};

const getTasks = async (userId, filters = {}) => {
  const params = [userId];
  let sqlText = `
    SELECT
      id, user_id, category_id, title, description, status, priority, due_date, pomodoro_count, created_at, updated_at,
      ${SUBTASKS_SUBQUERY}
    FROM Tasks
    WHERE user_id = $1
  `;

  if (filters.search) {
    params.push(`%${filters.search}%`);
    sqlText += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  if (filters.status) {
    params.push(filters.status);
    sqlText += ` AND status = $${params.length}`;
  }

  if (filters.priority) {
    params.push(filters.priority);
    sqlText += ` AND priority = $${params.length}`;
  }

  if (filters.categoryId) {
    params.push(parseInt(filters.categoryId, 10));
    sqlText += ` AND category_id = $${params.length}`;
  }

  if (filters.dueDate) {
    if (filters.dueDate === 'today') {
      sqlText += ` AND due_date::date = CURRENT_DATE`;
    } else if (filters.dueDate === 'upcoming') {
      sqlText += ` AND due_date::date > CURRENT_DATE AND status != 'COMPLETED'`;
    } else if (filters.dueDate === 'overdue') {
      sqlText += ` AND due_date::date < CURRENT_DATE AND status != 'COMPLETED'`;
    }
  }

  const validSorts = {
    dueDateAsc: 'due_date ASC',
    dueDateDesc: 'due_date DESC',
    createdAtAsc: 'created_at ASC',
    createdAtDesc: 'created_at DESC',
    priorityDesc:
      "CASE priority WHEN 'URGENT' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END DESC",
  };
  sqlText += ` ORDER BY ${validSorts[filters.sort] || 'created_at DESC'}`;

  const result = await query(sqlText, params);
  return parseSubtasks(result.rows);
};

const getTaskStats = async (userId) => {
  const statsQuery = `
    SELECT
      COUNT(id)::int AS total_tasks,
      COALESCE(SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END), 0)::int AS todo_tasks,
      COALESCE(SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0)::int AS in_progress_tasks,
      COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), 0)::int AS completed_tasks,
      COALESCE(SUM(CASE WHEN status != 'COMPLETED' AND due_date::date < CURRENT_DATE THEN 1 ELSE 0 END), 0)::int AS overdue_tasks,
      COALESCE(SUM(CASE WHEN due_date::date = CURRENT_DATE THEN 1 ELSE 0 END), 0)::int AS today_tasks
    FROM Tasks
    WHERE user_id = $1
  `;

  const result = await query(statsQuery, [userId]);
  const stats = result.rows[0] || {};

  const pomodoroQuery = `
    SELECT
      c.name AS name,
      c.color AS color,
      COALESCE(SUM(t.pomodoro_count), 0)::int AS value
    FROM Tasks t
    JOIN Categories c ON t.category_id = c.id
    WHERE t.user_id = $1 AND t.pomodoro_count > 0
    GROUP BY c.id, c.name, c.color
  `;
  const pomodoroResult = await query(pomodoroQuery, [userId]);

  const totalTasks = stats.total_tasks || 0;
  const completedTasks = stats.completed_tasks || 0;

  return {
    totalTasks,
    todoTasks: stats.todo_tasks || 0,
    inProgressTasks: stats.in_progress_tasks || 0,
    completedTasks,
    overdueTasks: stats.overdue_tasks || 0,
    todayTasks: stats.today_tasks || 0,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    categoryPomodoros: pomodoroResult.rows || [],
  };
};

const getTaskById = async (userId, taskId) => {
  const result = await query(
    `
      SELECT
        id, user_id, category_id, title, description, status, priority, due_date, pomodoro_count, created_at, updated_at,
        ${SUBTASKS_SUBQUERY}
      FROM Tasks
      WHERE id = $1 AND user_id = $2
    `,
    [taskId, userId]
  );

  if (result.rows.length === 0) return null;
  return parseSubtasks(result.rows)[0];
};

const createTask = async (userId, data) => {
  try {
    const newTaskId = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `
          INSERT INTO Tasks (user_id, category_id, title, description, status, priority, due_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          userId,
          data.categoryId || null,
          data.title,
          data.description || null,
          data.status || 'TODO',
          data.priority || 'MEDIUM',
          data.dueDate || null,
        ]
      );

      const taskId = insertResult.rows[0].id;

      if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        for (const subtask of data.subtasks) {
          if (!subtask.title) continue;
          await client.query(
            `INSERT INTO Subtasks (task_id, title, is_completed) VALUES ($1, $2, $3)`,
            [taskId, subtask.title, Boolean(subtask.is_completed)]
          );
        }
      }

      return taskId;
    });

    return await getTaskById(userId, newTaskId);
  } catch (error) {
    if (error.code === '23503') {
      throw { statusCode: 404, message: 'Category not found or category not owned by user' };
    }
    throw error;
  }
};

const updateTask = async (userId, taskId, data) => {
  const task = await getTaskById(userId, taskId);
  if (!task) {
    throw { statusCode: 404, message: 'Task not found or access denied' };
  }

  try {
    const gamificationStats = await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE Tasks
          SET
            title = $1,
            description = $2,
            category_id = $3,
            status = $4,
            priority = $5,
            due_date = $6,
            updated_at = NOW()
          WHERE id = $7 AND user_id = $8
        `,
        [
          data.title !== undefined ? data.title : task.title,
          data.description !== undefined ? data.description : task.description,
          data.categoryId !== undefined ? data.categoryId : task.category_id,
          data.status !== undefined ? data.status : task.status,
          data.priority !== undefined ? data.priority : task.priority,
          data.dueDate !== undefined ? data.dueDate : task.due_date,
          taskId,
          userId,
        ]
      );

      if (data.subtasks !== undefined && Array.isArray(data.subtasks)) {
        const existingIds = data.subtasks.filter((st) => st.id).map((st) => parseInt(st.id, 10));
        if (existingIds.length > 0) {
          await client.query(
            `DELETE FROM Subtasks WHERE task_id = $1 AND NOT (id = ANY($2::int[]))`,
            [taskId, existingIds]
          );
        } else {
          await client.query(`DELETE FROM Subtasks WHERE task_id = $1`, [taskId]);
        }

        for (const st of data.subtasks) {
          if (!st.title) continue;
          if (st.id) {
            await client.query(
              `UPDATE Subtasks SET title = $1, is_completed = $2, updated_at = NOW() WHERE id = $3 AND task_id = $4`,
              [st.title, Boolean(st.is_completed), st.id, taskId]
            );
          } else {
            await client.query(
              `INSERT INTO Subtasks (task_id, title, is_completed) VALUES ($1, $2, $3)`,
              [taskId, st.title, Boolean(st.is_completed)]
            );
          }
        }
      }

      if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
        return await gamificationService.recordTaskCompletion(userId, client);
      }
      return null;
    });

    const updatedTask = await getTaskById(userId, taskId);
    if (gamificationStats) {
      updatedTask.gamification = gamificationStats;
      const stats = await getTaskStats(userId);
      if (stats.todoTasks === 0 && stats.inProgressTasks === 0 && stats.completedTasks > 0) {
        updatedTask.gamification.allCompleted = true;
      }
    }

    return updatedTask;
  } catch (error) {
    if (error.code === '23503') {
      throw { statusCode: 404, message: 'Category not found or category not owned by user' };
    }
    throw error;
  }
};

const deleteTask = async (userId, taskId) => {
  const checkResult = await query(
    'SELECT id FROM Tasks WHERE id = $1 AND user_id = $2',
    [taskId, userId]
  );

  if (checkResult.rows.length === 0) {
    throw { statusCode: 404, message: 'Task not found or access denied' };
  }

  await query('DELETE FROM Tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  return true;
};

const updateSubtask = async (userId, subtaskId, isCompleted) => {
  const result = await query(
    `
      UPDATE Subtasks
      SET is_completed = $1, updated_at = NOW()
      WHERE id = $2 AND task_id IN (SELECT id FROM Tasks WHERE user_id = $3)
    `,
    [Boolean(isCompleted), subtaskId, userId]
  );

  if (result.rowCount === 0) {
    throw { statusCode: 403, message: 'Access denied to this subtask' };
  }
  return true;
};

const incrementPomodoro = async (userId, taskId) => {
  const result = await query(
    `
      UPDATE Tasks
      SET pomodoro_count = COALESCE(pomodoro_count, 0) + 1
      WHERE id = $1 AND user_id = $2
    `,
    [taskId, userId]
  );

  if (result.rowCount === 0) {
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
  incrementPomodoro,
};
