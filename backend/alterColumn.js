const { poolPromise } = require('./src/config/database');

async function alterColumn() {
  try {
    const pool = await poolPromise;
    console.log('Connected to database, altering column...');
    
    await pool.request().query(`
      ALTER TABLE Users
      ALTER COLUMN username NVARCHAR(255) NOT NULL
    `);
    console.log('Altered username to NVARCHAR(255).');
    
    // Might as well check Tasks table if it has title and description as VARCHAR
    try {
      await pool.request().query(`
        ALTER TABLE Tasks
        ALTER COLUMN title NVARCHAR(255) NOT NULL
      `);
      console.log('Altered Tasks.title to NVARCHAR');
    } catch(e) {}
    
    try {
      await pool.request().query(`
        ALTER TABLE Tasks
        ALTER COLUMN description NVARCHAR(MAX) NULL
      `);
      console.log('Altered Tasks.description to NVARCHAR');
    } catch(e) {}

    process.exit(0);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

alterColumn();
