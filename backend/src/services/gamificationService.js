const { sql, poolPromise } = require('../config/database');

const recordTaskCompletion = async (userId, transaction) => {
  const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
  
  // 1. Update DailyActivity
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const activityCheck = await request
    .input('userIdActivity', sql.Int, userId)
    .input('activityDate', sql.Date, today)
    .query('SELECT id, tasks_completed FROM DailyActivity WHERE user_id = @userIdActivity AND activity_date = @activityDate');

  if (activityCheck.recordset.length > 0) {
    await request
      .input('dailyActivityId', sql.Int, activityCheck.recordset[0].id)
      .query('UPDATE DailyActivity SET tasks_completed = tasks_completed + 1 WHERE id = @dailyActivityId');
  } else {
    await request.query('INSERT INTO DailyActivity (user_id, activity_date, tasks_completed) VALUES (@userIdActivity, @activityDate, 1)');
  }

  // 2. Update Streaks in Users table
  const userCheck = await request
    .input('userIdStreak', sql.Int, userId)
    .query('SELECT current_streak, highest_streak, last_active_date FROM Users WHERE id = @userIdStreak');

  const user = userCheck.recordset[0];
  let currentStreak = user.current_streak || 0;
  let highestStreak = user.highest_streak || 0;
  let lastActiveDate = user.last_active_date ? new Date(user.last_active_date) : null;
  
  let newStreak = currentStreak;
  
  const todayDateObj = new Date(today);
  
  if (!lastActiveDate) {
    newStreak = 1;
  } else {
    const lastActiveStr = lastActiveDate.toISOString().split('T')[0];
    if (lastActiveStr === today) {
      // Already active today, streak stays the same
    } else {
      // Check if last active was exactly yesterday
      const yesterday = new Date(todayDateObj);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActiveStr === yesterdayStr) {
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
  }

  if (newStreak > highestStreak) {
    highestStreak = newStreak;
  }

  await request
    .input('currentStreak', sql.Int, newStreak)
    .input('highestStreak', sql.Int, highestStreak)
    .input('lastActiveDate', sql.Date, today)
    .query('UPDATE Users SET current_streak = @currentStreak, highest_streak = @highestStreak, last_active_date = @lastActiveDate WHERE id = @userIdStreak');

  return { currentStreak, highestStreak };
};

const getGamificationData = async (userId) => {
  const pool = await poolPromise;
  
  // Get streaks
  const userResult = await pool.request()
    .input('userId', sql.Int, userId)
    .query('SELECT current_streak, highest_streak FROM Users WHERE id = @userId');
    
  // Get activity for heatmap (last 365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  
  const activityResult = await pool.request()
    .input('userId', sql.Int, userId)
    .input('oneYearAgo', sql.Date, oneYearAgo.toISOString().split('T')[0])
    .query('SELECT activity_date, tasks_completed FROM DailyActivity WHERE user_id = @userId AND activity_date >= @oneYearAgo ORDER BY activity_date ASC');

  return {
    streaks: userResult.recordset[0] || { current_streak: 0, highest_streak: 0 },
    activity: activityResult.recordset
  };
};

module.exports = {
  recordTaskCompletion,
  getGamificationData
};
