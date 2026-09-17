const { sql, poolPromise } = require('./src/config/database');

async function run() {
  try {
    const pool = await poolPromise;
    console.log("Connected to DB.");

    // Check if column exists
    const checkQuery = `
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Tasks' AND COLUMN_NAME = 'pomodoro_count'
      )
      BEGIN
        ALTER TABLE Tasks ADD pomodoro_count INT DEFAULT 0;
        SELECT 'Column added' as result;
      END
      ELSE
      BEGIN
        SELECT 'Column already exists' as result;
      END
    `;

    const result = await pool.request().query(checkQuery);
    console.log("Result:", result.recordset[0].result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
