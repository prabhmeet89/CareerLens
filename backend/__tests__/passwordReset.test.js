'use strict';

const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { app } = require('../src/server');
const User = require('../src/models/User');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testSetup');

describe('Password Reset Flow (/api/auth/forgot-password & /api/auth/reset-password)', () => {
  const testUser = {
    name: 'Reset Test User',
    email: 'reset.tester@example.com',
    password: 'OldPassword123!',
  };

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testUser.password, salt);
    await User.create({
      name: testUser.name,
      email: testUser.email,
      passwordHash,
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('returns generic success message for an existing registered user and stores only hashed token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/If an account exists/i);

      // Verify token hash is stored in database
      const user = await User.findOne({ email: testUser.email }).select(
        '+resetPasswordTokenHash +resetPasswordExpires'
      );
      expect(user.resetPasswordTokenHash).toBeDefined();
      expect(typeof user.resetPasswordTokenHash).toBe('string');
      expect(user.resetPasswordTokenHash).toHaveLength(64); // SHA-256 hex string
      expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    test('returns the exact same success message for a non-existent email (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody_here_9999@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/If an account exists/i);
    });

    test('returns 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let rawToken;
    let tokenHash;

    beforeEach(async () => {
      rawToken = crypto.randomBytes(32).toString('hex');
      tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await User.findOneAndUpdate(
        { email: testUser.email },
        {
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hr future
        }
      );
    });

    test('successfully resets password with valid token and clears reset fields (single-use)', async () => {
      const newPassword = 'BrandNewPassword456!';

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          token: rawToken,
          newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/successfully reset/i);

      // Verify token hash is wiped out
      const user = await User.findOne({ email: testUser.email }).select(
        '+resetPasswordTokenHash +resetPasswordExpires'
      );
      expect(user.resetPasswordTokenHash).toBeFalsy();
      expect(user.resetPasswordExpires).toBeFalsy();

      // Verify old password no longer works
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(oldLogin.status).toBe(401);

      // Verify new password works
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: newPassword });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);
    });

    test('rejects attempt to reuse the same token after reset', async () => {
      // First reset
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          token: rawToken,
          newPassword: 'FirstNewPassword123!',
        });

      // Second attempt with same token
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          token: rawToken,
          newPassword: 'SecondNewPassword456!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or has expired/i);
    });

    test('rejects expired token', async () => {
      // Set expired timestamp in past
      await User.findOneAndUpdate(
        { email: testUser.email },
        {
          resetPasswordExpires: new Date(Date.now() - 10000), // 10s ago
        }
      );

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          token: rawToken,
          newPassword: 'ExpiredAttempt123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or has expired/i);
    });

    test('rejects incorrect / tampered token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          token: 'invalid_tampered_token_string',
          newPassword: 'ValidPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or has expired/i);
    });

    test('rejects password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          token: rawToken,
          newPassword: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
