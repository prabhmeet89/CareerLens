'use strict';
const rateLimit = require('express-rate-limit');

const sharedOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Disable all validation warnings in dev (IPv6 false-positives on localhost)
};

const isProduction = process.env.NODE_ENV === 'production';

// Never let a shared counter make the Jest suite order-dependent — a limiter
// that trips mid-run would fail whichever test happened to come last.
const skipInTests = () => process.env.NODE_ENV === 'test';

/**
 * Global API baseline: 200 req/15min in prod, 5000 in dev
 */
const apiLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 5000,
  skip: skipInTests,
  keyGenerator: (req) => req.ip || 'local',
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment before trying again.',
    });
  },
});

/**
 * Auth brute-force protection for login & register.
 *
 * Only failed attempts count (skipSuccessfulRequests), so a legitimate user
 * signing in repeatedly is never locked out — the budget is spent solely on
 * wrong credentials. Tight in production; permissive in development so an
 * afternoon of testing the login form doesn't lock you out of your own app.
 */
const authLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 100,
  skipSuccessfulRequests: true,
  skip: skipInTests,
  keyGenerator: (req) => `auth_${req.ip || 'local'}`,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
    });
  },
});

/**
 * Resume upload limiter: 20 uploads per hour per user/IP (relaxed for dev)
 */
const resumeUploadLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  max: 20,
  skip: skipInTests,
  keyGenerator: (req) => (req.user?.id ? `upload_user_${req.user.id}` : `upload_ip_${req.ip || 'local'}`),
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Upload limit reached. You can upload up to 20 resumes per hour in dev mode.',
    });
  },
});

module.exports = { apiLimiter, authLimiter, resumeUploadLimiter };

