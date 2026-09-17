const { poolPromise } = require('./src/config/database');

async function updateSchema() {
  try {
    const pool = await poolPromise;
    console.log('Connected to database, adding columns...');
    
    // Add avatar_url column
    try {
      await pool.request().query(`
        ALTER TABLE Users
        ADD avatar_url NVARCHAR(255) NULL
      `);
      console.log('Added avatar_url column to Users table.');
    } catch (err) {
      if (err.message.includes('already has a') || err.message.includes('Column already exists') || err.number === 2705) {
        console.log('avatar_url column already exists.');
      } else {
        console.error('Error adding avatar_url:', err.message);
      }
    }

    // Add theme_color column
    try {
      await pool.request().query(`
        ALTER TABLE Users
        ADD theme_color NVARCHAR(50) NULL
      `);
      console.log('Added theme_color column to Users table.');
    } catch (err) {
      if (err.message.includes('already has a') || err.message.includes('Column already exists') || err.number === 2705) {
        console.log('theme_color column already exists.');
      } else {
        console.error('Error adding theme_color:', err.message);
      }
    }

    console.log('Database schema update complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update schema:', error);
    process.exit(1);
  }
}

updateSchema();
