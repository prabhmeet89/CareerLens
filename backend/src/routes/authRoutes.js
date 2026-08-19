'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');

// NOTE: authLimiter (5 attempts / 15 min) is intentionally disabled in dev.
// Re-add it before production: router.post('/login', authLimiter, ...)
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected current user endpoint
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
