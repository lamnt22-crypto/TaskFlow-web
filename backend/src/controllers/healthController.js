const healthService = require('../services/healthService');

/**
 * Health Controller
 * Handles the HTTP request/response for the health check endpoint.
 */
const getHealthStatus = async (req, res, next) => {
  try {
    const dbStatus = await healthService.checkDatabaseStatus();
    
    if (dbStatus.connected) {
      return res.status(200).json({
        success: true,
        server: 'online',
        database: 'connected'
      });
    } else {
      return res.status(503).json({
        success: false,
        server: 'online',
        database: 'disconnected',
        error: dbStatus.error
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus
};
