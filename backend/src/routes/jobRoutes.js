'use strict';
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');
const { toggleSaveJob } = require('../controllers/savedJobController');
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

      // Invalidate recommended jobs cache for all users after re-seeding
      try {
        const { delCache } = require('../config/redis');
        await delCache('recommended:*');
      } catch {
        // Redis not available — no cache to invalidate
      }

      // Emit new_match notifications for high-matching users (best-effort)
      try {
        const io = req.app.get('io');
        if (io) {
          const CandidateProfile = require('../models/CandidateProfile');
          const Notification = require('../models/Notification');
          const { calculateMatchScore } = require('../services/matchingEngine');

          const profiles = await CandidateProfile.find({}).lean();
          for (const profile of profiles) {
            for (const job of inserted) {
              const match = calculateMatchScore(profile, job.toObject ? job.toObject() : job);
              if (match.score >= 85) {
                const notif = await Notification.create({
                  userId: profile.userId,
                  type: 'new_match',
                  title: '🎯 New High-Match Job!',
                  message: `"${job.title}" at ${job.company} is a ${match.score}% match for your profile!`,
                  jobId: job._id,
                  read: false,
                });
                io.to(profile.userId.toString()).emit('notification:new', {
                  id: notif._id.toString(),
                  type: notif.type,
                  title: notif.title,
                  message: notif.message,
                  jobId: notif.jobId,
                  read: false,
                  createdAt: notif.createdAt,
                });
              }
            }
          }
        }
      } catch (notifErr) {
        console.warn('[Dev-seed] Notification emit failed (non-critical):', notifErr.message);
      }

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

// Phase 5: Save/Unsave job toggle
router.post('/:id/save', authMiddleware, toggleSaveJob);

// Phase 4: AI Match Explanation endpoint
router.get('/:id/explain', authMiddleware, jobController.getMatchExplanation);

// Phase 4: AI Learning Roadmap generation & retrieval endpoints
router.post('/:id/roadmap', authMiddleware, jobController.getOrGenerateRoadmap);
router.get('/:id/roadmap', authMiddleware, jobController.getOrGenerateRoadmap);

// General jobs listing (Public with optional user personalization)
router.get('/', optionalAuth, jobController.getJobs);

// Single job detail endpoint (Public with optional user match breakdown)
router.get('/:id', optionalAuth, jobController.getJobById);

module.exports = router;
