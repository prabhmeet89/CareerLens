const rateLimit = require('express-rate-limit');

// Rate limit: 5 uploads per hour per user / IP
const resumeUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user/IP to 5 resume uploads per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  validate: {
    ip: false,
    trustProxy: false,
  },
  keyGenerator: (req) => {
    // Rate limit per authenticated user ID if available, otherwise per IP
    return req.user?.id ? `user_${req.user.id}` : `ip_${req.ip}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Upload limit reached. You can upload up to 5 resumes per hour. Please try again later.',
    });
  },
});

module.exports = {
  resumeUploadLimiter,
};
