'use strict';
const request = require('supertest');
const { app } = require('../src/server');
const { connectTestDB, closeTestDB } = require('./testSetup');

describe('Service Health, Readiness & Observability Endpoints', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('GET /api/health (Liveness)', () => {
    test('returns 200 with online status and uptime', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('online');
      expect(res.body.service).toBe('CareerLens API');
      expect(typeof res.body.uptimeSeconds).toBe('number');
      expect(res.body.timestamp).toBeDefined();
    });

    test('GET /api/health/live returns 200 online', async () => {
      const res = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(res.body.status).toBe('online');
    });
  });

  describe('GET /api/health/ready (Readiness)', () => {
    test('returns 200 ready when MongoDB is connected', async () => {
      const res = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(res.body.status).toBe('ready');
      expect(res.body.ready).toBe(true);
      expect(res.body.database).toBe('connected');
    });
  });

  describe('GET /api/health/detailed (Diagnostics)', () => {
    test('returns 200 with dependency statuses without exposing secrets', async () => {
      const res = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(res.body.status).toBe('healthy');
      expect(res.body.dependencies).toBeDefined();
      expect(res.body.dependencies.mongodb.healthy).toBe(true);
      expect(res.body.dependencies.redis).toBeDefined();
      expect(res.body.dependencies.geminiAI).toBeDefined();

      // Verify no secrets or sensitive fields are exposed
      const jsonString = JSON.stringify(res.body);
      expect(jsonString).not.toContain('mongodb://');
      expect(jsonString).not.toContain('redis://');
      expect(jsonString).not.toContain('AIzaSy');
      expect(jsonString).not.toContain('password');
    });
  });

  describe('X-Request-Id Correlation Header', () => {
    test('attaches X-Request-Id header to every response', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
    });

    test('preserves incoming valid X-Request-Id', async () => {
      const customId = 'client-correlation-id-998877';
      const res = await request(app)
        .get('/api/health')
        .set('X-Request-Id', customId)
        .expect(200);

      expect(res.headers['x-request-id']).toBe(customId);
    });
  });
});
