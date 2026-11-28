const crypto = require('crypto');

/**
 * Returns a trimmed JWT access secret, falling back to a deterministic key
 * derived from environment secrets so auth never crashes if JWT_ACCESS_SECRET is unset.
 */
const getJwtAccessSecret = () => {
  const secret = (process.env.JWT_ACCESS_SECRET || '').trim();
  if (secret) return secret;

  const fallbackSeed = (
    process.env.SESSION_SECRET ||
    process.env.DATABASE_URL ||
    'taskflow_jwt_fallback_secret_2026'
  ).trim();
  return crypto.createHash('sha256').update(`access:${fallbackSeed}`).digest('hex');
};

/**
 * Returns a sanitized JWT expiration timespan string.
 */
const getJwtExpiresIn = () => {
  const raw = (process.env.JWT_ACCESS_EXPIRES_IN || '15m').trim();
  return raw || '15m';
};

module.exports = {
  getJwtAccessSecret,
  getJwtExpiresIn,
};
