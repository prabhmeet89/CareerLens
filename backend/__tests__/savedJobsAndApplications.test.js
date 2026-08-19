'use strict';
const request = require('supertest');
const { app } = require('../src/server');
const { connectTestDB, closeTestDB, clearTestDB, createTestUser, createTestToken } = require('./testSetup');
const Job = require('../src/models/Job');
const SavedJob = require('../src/models/SavedJob');
const Application = require('../src/models/Application');

describe('Saved Jobs & Application Tracking API with Auth Boundary Verification', () => {
  let userA, tokenA;
  let userB, tokenB;
  let sampleJob;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    userA = await createTestUser({ name: 'User A', email: 'user.a@test.edu' });
    tokenA = createTestToken(userA._id);

    userB = await createTestUser({ name: 'User B', email: 'user.b@test.edu' });
    tokenB = createTestToken(userB._id);

    sampleJob = await Job.create({
      title: 'Full Stack Engineer',
      company: 'Linear',
      description: 'Build fast, high-quality software with Linear using React, TypeScript, and Node.js.',
      location: 'Remote',
      employmentType: 'full-time',
      experienceRequired: '0-2 years',
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    });
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('Saved Jobs (POST /api/jobs/:id/save & GET /api/saved-jobs)', () => {
    test('User A saves a job successfully and sees saved: true', async () => {
      const res = await request(app)
        .post(`/api/jobs/${sampleJob._id}/save`)
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.saved).toBe(true);

      const savedRecord = await SavedJob.findOne({ userId: userA._id, jobId: sampleJob._id });
      expect(savedRecord).toBeDefined();
    });

    test('Toggling save on already saved job removes it (saved: false)', async () => {
      // First save
      await request(app)
        .post(`/api/jobs/${sampleJob._id}/save`)
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      // Second call should unsave
      const res = await request(app)
        .post(`/api/jobs/${sampleJob._id}/save`)
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.saved).toBe(false);

      const savedRecord = await SavedJob.findOne({ userId: userA._id, jobId: sampleJob._id });
      expect(savedRecord).toBeNull();
    });

    test('GET /api/saved-jobs is strictly scoped to the authenticated user (User A does not see User B saves)', async () => {
      // User B saves the job
      await SavedJob.create({ userId: userB._id, jobId: sampleJob._id });

      // User A requests saved jobs
      const resA = await request(app)
        .get('/api/saved-jobs')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(resA.body.success).toBe(true);
      expect(resA.body.data.jobs.length).toBe(0); // User A has zero saved jobs

      // User B requests saved jobs
      const resB = await request(app)
        .get('/api/saved-jobs')
        .set('Cookie', [`token=${tokenB}`])
        .expect(200);

      expect(resB.body.success).toBe(true);
      expect(resB.body.data.jobs.length).toBe(1);
      expect(resB.body.data.jobs[0].company).toBe('Linear');
    });
  });

  describe('Application Tracking (POST, GET, PATCH /api/applications)', () => {
    test('User A applies to a job and default status is "Applied"', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Cookie', [`token=${tokenA}`])
        .send({ jobId: sampleJob._id.toString() })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Applied');
      expect(res.body.data.job.company).toBe('Linear');

      const appDoc = await Application.findOne({ userId: userA._id, jobId: sampleJob._id });
      expect(appDoc).toBeDefined();
    });

    test('Prevents duplicate applications to the same job by the same user (returns 409)', async () => {
      // First application
      await request(app)
        .post('/api/applications')
        .set('Cookie', [`token=${tokenA}`])
        .send({ jobId: sampleJob._id.toString() })
        .expect(201);

      // Duplicate attempt
      const res = await request(app)
        .post('/api/applications')
        .set('Cookie', [`token=${tokenA}`])
        .send({ jobId: sampleJob._id.toString() })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already applied/i);
    });

    test('User A updates own application status and notes via PATCH', async () => {
      const appDoc = await Application.create({
        userId: userA._id,
        jobId: sampleJob._id,
        status: 'Applied',
      });

      const res = await request(app)
        .patch(`/api/applications/${appDoc._id}`)
        .set('Cookie', [`token=${tokenA}`])
        .send({
          status: 'Interview',
          notes: 'Completed behavioral round, technical interview scheduled.',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Interview');
      expect(res.body.data.notes).toBe('Completed behavioral round, technical interview scheduled.');
    });

    test('Returns 400 Bad Request when updating with an invalid status enum', async () => {
      const appDoc = await Application.create({
        userId: userA._id,
        jobId: sampleJob._id,
        status: 'Applied',
      });

      const res = await request(app)
        .patch(`/api/applications/${appDoc._id}`)
        .set('Cookie', [`token=${tokenA}`])
        .send({ status: 'InvalidStatusName' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('GET /api/applications provides accurate stats count per status stage', async () => {
      const job2 = await Job.create({ title: 'Engineer 2', company: 'Notion', description: 'Collaborative workspaces.', location: 'Remote', skills: ['React'] });
      const job3 = await Job.create({ title: 'Engineer 3', company: 'Figma', description: 'Design tools on the web.', location: 'Remote', skills: ['C++'] });

      await Application.create({ userId: userA._id, jobId: sampleJob._id, status: 'Applied' });
      await Application.create({ userId: userA._id, jobId: job2._id, status: 'Interview' });
      await Application.create({ userId: userA._id, jobId: job3._id, status: 'Offer' });

      const res = await request(app)
        .get('/api/applications')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.stats.Applied).toBe(1);
      expect(res.body.data.stats.Interview).toBe(1);
      expect(res.body.data.stats.Offer).toBe(1);
      expect(res.body.data.stats.Rejected).toBe(0);
    });
  });

  describe('Authorization Boundaries & Multi-User Isolation', () => {
    test('User B CANNOT modify User A application by targeting its ID (returns 404 / unauthorized)', async () => {
      const userAApplication = await Application.create({
        userId: userA._id,
        jobId: sampleJob._id,
        status: 'Applied',
      });

      // User B attempts to change User A's application status to 'Rejected'
      const res = await request(app)
        .patch(`/api/applications/${userAApplication._id}`)
        .set('Cookie', [`token=${tokenB}`])
        .send({ status: 'Rejected' })
        .expect(404);

      expect(res.body.success).toBe(false);

      // Verify User A's record remained unchanged in DB
      const freshDoc = await Application.findById(userAApplication._id);
      expect(freshDoc.status).toBe('Applied');
    });

    test('User B CANNOT see User A application in their applications list', async () => {
      await Application.create({
        userId: userA._id,
        jobId: sampleJob._id,
        status: 'Applied',
      });

      const res = await request(app)
        .get('/api/applications')
        .set('Cookie', [`token=${tokenB}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.applications.length).toBe(0);
    });
  });
});
