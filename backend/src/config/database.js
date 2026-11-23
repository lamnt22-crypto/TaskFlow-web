const sql = require('mssql');
require('dotenv').config();

// SQL Server configuration object read entirely from environment variables
const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure/production, false for local dev usually
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false', // Default true for dev
    enableArithAbort: true
  }
};

// If using a named instance like SQLEXPRESS, set instanceName.
// Tedious requires omitting the port to resolve dynamic ports via SQL Browser.
if (process.env.DB_INSTANCE) {
  dbConfig.options.instanceName = process.env.DB_INSTANCE;
} else {
  dbConfig.port = parseInt(process.env.DB_PORT) || 1433;
}

let pool = null;
let connectingPromise = null;

/**
 * Get or create an active database connection pool.
 * Automatically retries if previously disconnected or failed.
 */
async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }
  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      if (pool) {
        try { await pool.close(); } catch (_) {}
      }
      pool = new sql.ConnectionPool(dbConfig);
      pool.on('error', err => {
        console.error('❌ SQL Server Pool Error:', err.message);
        pool = null;
      });
      await pool.connect();
      console.log('✅ Successfully connected to SQL Server Database');
      return pool;
    } catch (err) {
      pool = null;
      console.error('❌ Database Connection Failed:\n', err.message);
      throw err;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

// poolPromise is a Thenable proxy to getPool(), ensuring backward compatibility
// for all existing imports: `const pool = await poolPromise`, `poolPromise.then()`, etc.
// If a connection attempt failed previously or the database was restarted,
// awaiting `poolPromise` will automatically retry connecting rather than staying permanently rejected.
const poolPromise = {
  then(onFulfilled, onRejected) {
    return getPool().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getPool().catch(onRejected);
  },
  finally(onFinally) {
    return getPool().finally(onFinally);
  },
  request(...args) {
    return getPool().then(p => p.request(...args));
  }
};

// Trigger initial connection on startup without crashing if DB starts with slight delay
getPool().catch(() => {
  console.warn('⚠️ Initial database connection pending. Queries will retry automatically upon request.');
});

module.exports = {
  sql,
  poolPromise,
  getPool
};

