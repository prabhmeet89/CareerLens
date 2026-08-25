'use strict';
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isRedisReady } = require('../config/redis');

/**
 * @route   GET /api/health (or /api/health/live)
 * @desc    Liveness probe: fast confirmation that server process is running
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'CareerLens API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'CareerLens API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness probe: validates required dependencies (MongoDB)
 * @access  Public
 */
router.get('/ready', (req, res) => {
  // MongoDB readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const mongoState = mongoose.connection.readyState;
  const isMongoReady = mongoState === 1;

  if (!isMongoReady) {
    return res.status(503).json({
      status: 'unavailable',
      ready: false,
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'ready',
    ready: true,
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Diagnostic health: reports MongoDB, Redis, and Gemini status safely
 * @access  Public
 */
router.get('/detailed', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const redisConfigured = Boolean(process.env.REDIS_URL);
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_gemini_api_key')
  );

  const isHealthy = mongoState === 1;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'CareerLens API',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies: {
      mongodb: {
        status: mongoStatusMap[mongoState] || 'unknown',
        healthy: mongoState === 1,
      },
      redis: {
        configured: redisConfigured,
        status: !redisConfigured
          ? 'not_configured'
          : isRedisReady()
          ? 'connected'
          : 'unavailable',
        optional: true,
      },
      geminiAI: {
        configured: geminiConfigured,
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        fallbackAvailable: true,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
