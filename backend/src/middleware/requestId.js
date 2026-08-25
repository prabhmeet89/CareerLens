'use strict';
const crypto = require('crypto');

/**
 * Request ID middleware
 * Generates a unique UUID v4 for each incoming request (or validates incoming X-Request-Id)
 * and attaches it to `req.id` and response header `X-Request-Id`.
 */
const requestId = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];

  // Accept incoming ID if safe (alphanumeric and hyphens, 10-64 chars), otherwise generate fresh UUID
  const id =
    typeof incomingId === 'string' && /^[a-zA-Z0-9_-]{10,64}$/.test(incomingId)
      ? incomingId
      : crypto.randomUUID();

  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = requestId;
