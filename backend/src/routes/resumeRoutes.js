const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const { resumeUploadLimiter } = require('../middleware/rateLimiter');

// All resume routes require authentication
router.use(authMiddleware);

// Upload a single PDF resume (rate limited to 5/hr)
router.post('/upload', resumeUploadLimiter, uploadMiddleware, resumeController.uploadResume);

// Extract text and analyze with AI Claude
router.post('/:id/analyze', resumeController.analyzeResume);

// Check status of an uploaded resume
router.get('/:id/status', resumeController.getResumeStatus);

module.exports = router;
