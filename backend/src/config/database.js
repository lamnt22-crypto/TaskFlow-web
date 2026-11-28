const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : '';

const isLocalConnection =
  !connectionString
    ? ['localhost', '127.0.0.1'].includes(process.env.PGHOST || process.env.DB_SERVER || 'localhost')
    : connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const useSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_SSL !== 'false' && (process.env.NODE_ENV === 'production' || !isLocalConnection));

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 15000,
    }
  : {
      host: process.env.PGHOST || process.env.DB_SERVER || 'localhost',
      port: parseInt(process.env.PGPORT || process.env.DB_PORT, 10) || 5432,
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.PGDATABASE || process.env.DB_NAME || 'taskflow_db',
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 15000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error:', err.message);
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    theme_color VARCHAR(50) NULL,
    google_id VARCHAR(255) UNIQUE NULL,
    github_id VARCHAR(255) UNIQUE NULL,
    current_streak INT NOT NULL DEFAULT 0,
    highest_streak INT NOT NULL DEFAULT 0,
    last_active_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#000000',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_categories_id_userid UNIQUE (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    due_date TIMESTAMP NULL,
    pomodoro_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_categories FOREIGN KEY (category_id, user_id) REFERENCES categories(id, user_id) ON DELETE NO ACTION
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    estimated_time VARCHAR(100) NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS refreshtokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hashed_token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL DEFAULT 'Cuộc trò chuyện mới',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chatmessages (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id INT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    suggestions JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE chatmessages ADD COLUMN IF NOT EXISTS session_id INT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE;
  ALTER TABLE chatmessages ADD COLUMN IF NOT EXISTS suggestions JSONB NULL;

  CREATE TABLE IF NOT EXISTS dailyactivity (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    tasks_completed INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_dailyactivity_userdate UNIQUE (user_id, activity_date)
  );

  CREATE INDEX IF NOT EXISTS ix_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS ix_tasks_category_id ON tasks(category_id);
  CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS ix_tasks_priority ON tasks(priority);
  CREATE INDEX IF NOT EXISTS ix_tasks_due_date ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS ix_categories_user_id ON categories(user_id);
  CREATE INDEX IF NOT EXISTS ix_refreshtokens_user_id ON refreshtokens(user_id);
  CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_id ON chat_sessions(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS ix_chatmessages_user_session ON chatmessages(user_id, session_id, created_at ASC);
`;

let schemaReadyPromise = null;

/**
 * Ensures PostgreSQL connection is live and all required tables exist.
 * Safe to call concurrently; caches success and retries if initial attempt fails.
 */
async function ensureDatabaseReady() {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    try {
      await pool.query('SELECT 1');
      await pool.query(SCHEMA_SQL);
      console.log('✅ Successfully connected to PostgreSQL Database & verified schema');
      return true;
    } catch (err) {
      schemaReadyPromise = null;
      console.error('❌ PostgreSQL Connection / Schema Error:', err.message);
      throw err;
    }
  })();

  return schemaReadyPromise;
}

/**
 * Execute a parameterized PostgreSQL query, ensuring schema is initialized first.
 */
async function query(text, params = []) {
  await ensureDatabaseReady();
  return pool.query(text, params);
}

/**
 * Run a callback inside a PostgreSQL transaction (BEGIN / COMMIT / ROLLBACK).
 */
async function withTransaction(callback) {
  await ensureDatabaseReady();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

// Trigger initial connection on startup without crashing the process if DB wakes slowly
ensureDatabaseReady().catch(() => {
  console.warn('⚠️ Initial PostgreSQL connection pending. Queries will retry automatically upon request.');
});

module.exports = {
  pool,
  query,
  withTransaction,
  ensureDatabaseReady,
};
