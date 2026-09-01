'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');
const { toggleSaveJob } = require('../controllers/savedJobController');
const User = require('../models/User');
const Job = require('../models/Job');

// Optional auth helper for public job endpoints to optionally score jobs if logged in
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7).trim();
    }
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

// Title/skill autocomplete suggestions (Public, lightweight — must be before /:id)
router.get('/suggestions', jobController.getTitleSuggestions);

// Location suggestions ordered by job count (Public, lightweight — must be before /:id)
router.get('/location-suggestions', jobController.getLocationSuggestions);

// Development utility endpoint — redirects to the real Adzuna fetch script
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-seed', async (req, res) => {
    // Count current real jobs to show useful status
    try {
      const count = await Job.countDocuments({ source: 'adzuna' });
      return res.status(200).json({
        success: true,
        message:
          'The fake seed job data has been removed. ' +
          'Run `npm run fetch:jobs` to populate the database with real Adzuna job listings.',
        adzunaJobsInDb: count,
        instructions: 'Add ADZUNA_APP_ID and ADZUNA_APP_KEY to backend/.env, then run: npm run fetch:jobs',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
}

// Phase 5: Save/Unsave job toggle
router.post('/:id/save', authMiddleware, toggleSaveJob);

// Phase 4: AI Match Explanation endpoints (with force regeneration support)
router.get('/:id/explain', authMiddleware, jobController.getMatchExplanation);
router.post('/:id/explain', authMiddleware, jobController.getMatchExplanation);

// Phase 4: AI Learning Roadmap generation & task progress endpoints
router.post('/:id/roadmap', authMiddleware, jobController.getOrGenerateRoadmap);
router.get('/:id/roadmap', authMiddleware, jobController.getOrGenerateRoadmap);
router.patch('/:id/roadmap/tasks/:taskId', authMiddleware, jobController.updateRoadmapTaskProgress);

// General jobs listing (Public with optional user personalization)
router.get('/', optionalAuth, jobController.getJobs);

// Single job detail endpoint (Public with optional user match breakdown)
router.get('/:id', optionalAuth, jobController.getJobById);

module.exports = router;
