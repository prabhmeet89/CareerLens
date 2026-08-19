'use strict';
const rateLimit = require('express-rate-limit');

const sharedOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Disable all validation warnings in dev (IPv6 false-positives on localhost)
};

/**
 * Global API baseline: 200 requests per 15 minutes per IP (generous for dev)
 */
const apiLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.ip || 'local',
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again in a few minutes.',
    });
  },
});

/**
 * Auth brute-force protection (disabled in dev — re-enable for production)
 * To use: import authLimiter and add to login/register routes
 */
const authLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  max: 100, // Very permissive in dev
  keyGenerator: (req) => `auth_${req.ip || 'local'}`,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait before trying again.',
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
  keyGenerator: (req) => (req.user?.id ? `upload_user_${req.user.id}` : `upload_ip_${req.ip || 'local'}`),
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Upload limit reached. You can upload up to 20 resumes per hour in dev mode.',
    });
  },
});

module.exports = { apiLimiter, authLimiter, resumeUploadLimiter };

