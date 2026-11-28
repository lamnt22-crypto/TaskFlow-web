const { query } = require('../config/database');

const recordTaskCompletion = async (userId, dbClient = null) => {
  const exec = dbClient ? (text, params) => dbClient.query(text, params) : query;

  // 1. Update DailyActivity (atomic upsert)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  await exec(
    `
      INSERT INTO DailyActivity (user_id, activity_date, tasks_completed)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, activity_date)
      DO UPDATE SET tasks_completed = DailyActivity.tasks_completed + 1
    `,
    [userId, today]
  );

  // 2. Update Streaks in Users table
  const userCheck = await exec(
    'SELECT current_streak, highest_streak, last_active_date FROM Users WHERE id = $1',
    [userId]
  );

  const user = userCheck.rows[0];
  let currentStreak = user?.current_streak || 0;
  let highestStreak = user?.highest_streak || 0;
  const lastActiveDate = user?.last_active_date ? new Date(user.last_active_date) : null;

  let newStreak = currentStreak;
  const todayDateObj = new Date(today);

  if (!lastActiveDate) {
    newStreak = 1;
  } else {
    const lastActiveStr = lastActiveDate.toISOString().split('T')[0];
    if (lastActiveStr !== today) {
      const yesterday = new Date(todayDateObj);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      newStreak = lastActiveStr === yesterdayStr ? newStreak + 1 : 1;
    }
  }

  if (newStreak > highestStreak) {
    highestStreak = newStreak;
  }

  await exec(
    'UPDATE Users SET current_streak = $1, highest_streak = $2, last_active_date = $3 WHERE id = $4',
    [newStreak, highestStreak, today, userId]
  );

  return { currentStreak: newStreak, highestStreak };
};

const getGamificationData = async (userId) => {
  const userResult = await query(
    'SELECT current_streak, highest_streak FROM Users WHERE id = $1',
    [userId]
  );

  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const activityResult = await query(
    `
      SELECT activity_date, tasks_completed
      FROM DailyActivity
      WHERE user_id = $1 AND activity_date >= $2
      ORDER BY activity_date ASC
    `,
    [userId, oneYearAgo.toISOString().split('T')[0]]
  );

  return {
    streaks: userResult.rows[0] || { current_streak: 0, highest_streak: 0 },
    activity: activityResult.rows,
  };
};

module.exports = {
  recordTaskCompletion,
  getGamificationData,
};
