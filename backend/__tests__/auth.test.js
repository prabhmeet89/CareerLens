'use strict';
const request = require('supertest');
const { app } = require('../src/server');
const { connectTestDB, closeTestDB, clearTestDB, createTestUser, createTestToken } = require('./testSetup');

describe('Authentication API (/api/auth)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/auth/register', () => {
    test('successfully registers a new student user and returns 201 with cookie', async () => {
      const payload = {
        name: 'Maya Lin',
        email: 'maya.lin@stanford.edu',
        password: 'password123',
        role: 'student',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('maya.lin@stanford.edu');
      expect(res.body.user.name).toBe('Maya Lin');
      expect(res.body.user.password).toBeUndefined(); // Ensure hashed password is not leaked

      // Verify HTTP-only cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    test('rejects registration with duplicate email with 409 Conflict', async () => {
      await createTestUser({ email: 'duplicate@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@test.com',
          password: 'password123',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('rejects registration with weak password (<6 characters) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short.pass@test.com',
          password: '123',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    test('rejects registration with invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        name: 'Jordan Lee',
        email: 'jordan.lee@mit.edu',
        password: 'securePassword123',
      });
    });

    test('successfully logs in with valid credentials and sets HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jordan.lee@mit.edu',
          password: 'securePassword123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('jordan.lee@mit.edu');
      expect(res.body.user.name).toBe('Jordan Lee');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    test('rejects login with incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jordan.lee@mit.edu',
          password: 'wrongPassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    test('rejects login for nonexistent email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@nowhere.edu',
          password: 'password123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me (Protected Route Verification)', () => {
    test('returns 401 Unauthorized when accessing without auth cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('returns 200 with current user data when authenticated with valid token cookie', async () => {
      const user = await createTestUser({
        name: 'Sam Chen',
        email: 'sam.chen@berkeley.edu',
      });
      const token = createTestToken(user._id);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('sam.chen@berkeley.edu');
      expect(res.body.user.name).toBe('Sam Chen');
    });

    test('rejects expired or forged token cookie with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['token=forged.or.invalid.token'])
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('clears auth cookie and returns 200', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token=;') || c.includes('Expires='))).toBe(true);
    });
  });
});
