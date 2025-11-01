const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

function getBooleanEnv(value, defaultValue = false) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function buildSslOptions() {
  const isRailway = Boolean(process.env.RAILWAY_PROJECT_ID);
  const shouldUseSsl = getBooleanEnv(process.env.DB_SSL, isRailway);

  if (!shouldUseSsl) {
    return undefined;
  }

  const rejectUnauthorizedDefault = isRailway ? false : true;
  const rejectUnauthorized = getBooleanEnv(
    process.env.DB_SSL_REJECT_UNAUTHORIZED,
    rejectUnauthorizedDefault
  );

  return { rejectUnauthorized };
}

function sanitizePathname(pathname) {
  if (!pathname) {
    return '';
  }

  return pathname.startsWith('/') ? pathname.slice(1) : pathname;
}

function buildConfigFromUrl(connectionUrl) {
  const url = new URL(connectionUrl);

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || ''),
    password: decodeURIComponent(url.password || ''),
    database: sanitizePathname(url.pathname),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    ssl: buildSslOptions()
  };
}

function buildConfigFromVariables() {
  const host = process.env.DB_HOST || process.env.MYSQLHOST;
  const port = process.env.DB_PORT || process.env.MYSQLPORT || 3306;
  const user = process.env.DB_USER || process.env.MYSQLUSER;
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE;

  if (!host || !user || !password || !database) {
    throw new Error(
      'Database environment variables are not fully configured. Please ensure host, user, password, and database are set.'
    );
  }

  return {
    host,
    port: Number(port),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    ssl: buildSslOptions()
  };
}

function buildPoolConfig() {
  const url = process.env.DATABASE_URL || process.env.DB_URL;

  if (url) {
    return buildConfigFromUrl(url);
  }

  return buildConfigFromVariables();
}

const pool = mysql.createPool(buildPoolConfig());

module.exports = pool;
