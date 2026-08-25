'use strict';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Format a log message safely.
 * In production: outputs JSON string with timestamp, level, service, message, and metadata.
 * In development: outputs formatted console string.
 */
function logStructured(level, message, meta = {}) {
  const timestamp = new Date().toISOString();

  // Strip or sanitize any accidental sensitive fields in meta
  const safeMeta = { ...meta };
  delete safeMeta.password;
  delete safeMeta.token;
  delete safeMeta.cookie;
  delete safeMeta.authorization;
  delete safeMeta.resumeText;
  delete safeMeta.apiKey;
  delete safeMeta.secret;

  if (isProduction) {
    const entry = {
      timestamp,
      level,
      service: 'careerlens-api',
      environment: process.env.NODE_ENV || 'production',
      message,
      ...(Object.keys(safeMeta).length > 0 ? safeMeta : {}),
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const metaStr = Object.keys(safeMeta).length > 0 ? ` ${JSON.stringify(safeMeta)}` : '';
    if (level === 'error') {
      console.error(`[${level.toUpperCase()}] ${message}${metaStr}`);
    } else if (level === 'warn') {
      console.warn(`[${level.toUpperCase()}] ${message}${metaStr}`);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}${metaStr}`);
    }
  }
}

const logger = {
  info: (msg, meta) => logStructured('info', msg, meta),
  warn: (msg, meta) => logStructured('warn', msg, meta),
  error: (msg, meta) => logStructured('error', msg, meta),
  http: (msg, meta) => logStructured('http', msg, meta),
};

module.exports = logger;
