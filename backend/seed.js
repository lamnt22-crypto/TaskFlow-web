const { sql, poolPromise } = require('./src/config/database');

async function checkTasks() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT TOP 5 id, user_id, title FROM Tasks WHERE title LIKE '%test ok%' OR title LIKE N'%sách%'");
    console.log('Found user ids:', res.recordset);
    
    if (res.recordset.length > 0) {
       const userId = res.recordset[0].user_id;
       await pool.request().query(`
          INSERT INTO Tasks (user_id, title, status, priority, created_at, updated_at) 
          VALUES 
          (${userId}, N'Lên ý tưởng thiết kế UI mới', 'TODO', 'HIGH', GETDATE(), GETDATE()),
          (${userId}, N'Fix lỗi CSS cho nút bấm', 'TODO', 'MEDIUM', GETDATE(), GETDATE()),
          (${userId}, N'Test chức năng kéo thả Kanban', 'IN_PROGRESS', 'URGENT', GETDATE(), GETDATE()),
          (${userId}, N'Review code Backend', 'IN_PROGRESS', 'LOW', GETDATE(), GETDATE())
       `);
       console.log('Seed data generated successfully for user_id:', userId);
    }
  } catch (error) {
    console.error('Failed', error);
  }
  process.exit(0);
}

checkTasks();
