const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const { SAMPLE_JOBS } = require('../../scripts/seedJobs');

// Optional auth helper for public job endpoints to optionally score jobs if logged in
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      if (decoded && decoded.userId) {
        const user = await User.findById(decoded.userId).lean();
        if (user) {
          req.user = { id: user._id.toString(), ...user };
        }
      }
    }
  } catch (err) {
    // Ignore invalid token on public routes
  }
  next();
};

// Recommended jobs endpoint (Strictly protected by auth)
router.get('/recommended', authMiddleware, jobController.getRecommendedJobs);

// Development seed endpoint for instant job seeding
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-seed', async (req, res) => {
    try {
      await Job.deleteMany({ source: 'seed' });
      const inserted = await Job.insertMany(SAMPLE_JOBS);
      return res.status(200).json({
        success: true,
        message: `Successfully seeded ${inserted.length} sample tech jobs!`,
        count: inserted.length,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
}

// General jobs listing (Public with optional user personalization)
router.get('/', optionalAuth, jobController.getJobs);

// Single job detail endpoint (Public with optional user match breakdown)
router.get('/:id', optionalAuth, jobController.getJobById);

module.exports = router;
