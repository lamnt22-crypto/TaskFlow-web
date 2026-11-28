const { query } = require('../config/database');

/**
 * Health Service
 * Executes a simple query to verify the database connection is alive.
 */
const checkDatabaseStatus = async () => {
  try {
    await query('SELECT 1');
    return { connected: true };
  } catch (error) {
    console.error('HealthService DB Check Error:', error.message);
    return { connected: false, error: error.message };
  }
};

module.exports = {
  checkDatabaseStatus,
};
