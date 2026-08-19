'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getSavedJobs } = require('../controllers/savedJobController');

// GET /api/saved-jobs — paginated list of saved jobs
router.get('/', authMiddleware, getSavedJobs);

module.exports = router;
