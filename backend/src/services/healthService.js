const { poolPromise } = require('../config/database');

/**
 * Health Service
 * Executes a simple query to verify the database connection is alive.
 */
const checkDatabaseStatus = async () => {
  try {
    const pool = await poolPromise;
    // Execute a simple SELECT 1 to ensure the DB is responsive
    await pool.request().query('SELECT 1');
    return { connected: true };
  } catch (error) {
    console.error('HealthService DB Check Error:', error.message);
    return { connected: false, error: error.message };
  }
};

module.exports = {
  checkDatabaseStatus
};
