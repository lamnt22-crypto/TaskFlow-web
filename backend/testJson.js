const { sql, poolPromise } = require('./src/config/database');

async function testJson() {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT id, title,
      (SELECT id, title FROM Subtasks WHERE task_id = t.id FOR JSON PATH) as subtasks
      FROM Tasks t
    `;
    const result = await pool.request().query(query);
    console.log(result.recordset);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testJson();
