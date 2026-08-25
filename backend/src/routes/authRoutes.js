'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// authLimiter counts only failed attempts: 10 per 15 min in production,
// 100 in development, and disabled under test.
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected current user endpoint
router.get('/me', authMiddleware, authController.getMe);

// Protected delete account endpoint
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;
