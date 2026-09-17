const sql = require('mssql');
require('dotenv').config();

// SQL Server configuration object read entirely from environment variables
const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure/production, false for local dev usually
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' // Allow self-signed certs for local dev
  }
};

// If using a named instance like SQLEXPRESS, set instanceName.
// Tedious requires omitting the port to resolve dynamic ports via SQL Browser.
if (process.env.DB_INSTANCE) {
  dbConfig.options.instanceName = process.env.DB_INSTANCE;
} else {
  dbConfig.port = parseInt(process.env.DB_PORT) || 1433;
}

// Create a reusable connection pool promise
// This ensures we do not create a new connection for every request
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Successfully connected to SQL Server Database');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed!\n', err);
    throw err; // Allow the server to stay running but health check will fail
  });

module.exports = {
  sql,
  poolPromise
};
