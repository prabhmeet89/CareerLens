'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');

// GET /api/notifications — paginated list with unread count
router.get('/', authMiddleware, getNotifications);

// PATCH /api/notifications/read-all — mark ALL as read (must be before /:id route)
router.patch('/read-all', authMiddleware, markAllRead);

// PATCH /api/notifications/:id/read — mark single notification as read
router.patch('/:id/read', authMiddleware, markRead);

module.exports = router;
