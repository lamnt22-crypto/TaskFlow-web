const healthService = require('./src/services/healthService');

healthService.checkDatabaseStatus().then(status => {
  console.log('Health status:', status);
  process.exit(0);
});
