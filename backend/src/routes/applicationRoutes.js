'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validate, createApplicationSchema, updateApplicationSchema } = require('../middleware/validate');
const { createApplication, getApplications, updateApplication } = require('../controllers/applicationController');

// POST /api/applications — Create a new application
router.post('/', authMiddleware, validate(createApplicationSchema), createApplication);

// GET /api/applications — List user's applications (paginated)
router.get('/', authMiddleware, getApplications);

// PATCH /api/applications/:id — Update status and/or notes
router.patch('/:id', authMiddleware, validate(updateApplicationSchema), updateApplication);

module.exports = router;
