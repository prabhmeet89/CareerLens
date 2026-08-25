'use strict';
const request = require('supertest');
const { app } = require('../src/server');
const { connectTestDB, closeTestDB, clearTestDB, createTestUser, createTestToken } = require('./testSetup');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const CandidateProfile = require('../src/models/CandidateProfile');
const SavedJob = require('../src/models/SavedJob');
const Application = require('../src/models/Application');
const Job = require('../src/models/Job');

describe('Privacy, Data Deletion & Account Erasure API', () => {
  let user;
  let token;
  let job;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    user = await createTestUser({
      name: 'Privacy Tester',
      email: 'privacy.tester@berkeley.edu',
      password: 'StrongPassword123!',
    });
    token = createTestToken(user._id);

    job = await Job.create({
      title: 'Security Software Engineer',
      company: 'Cloudflare',
      description: 'Build privacy and auth infrastructure.',
      location: 'Remote',
      employmentType: 'full-time',
      skills: ['Node.js', 'Security', 'Cryptography'],
      postedAt: new Date(),
    });

    // Create resume & profile
    await Resume.create({
      userId: user._id,
      originalFileName: 'Privacy_Resume.pdf',
      fileUrl: '/uploads/fake-resume-123.pdf',
      status: 'processed',
    });

    await CandidateProfile.create({
      userId: user._id,
      fullName: 'Privacy Tester',
      skills: ['Node.js', 'Security'],
      education: [{ degree: 'B.S.', field: 'CS' }],
    });

    // Create saved job and application
    await SavedJob.create({
      userId: user._id,
      jobId: job._id,
    });

    await Application.create({
      userId: user._id,
      jobId: job._id,
      status: 'Applied',
    });
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('DELETE /api/resume/me (Resume & Profile Deletion)', () => {
    test('requires authentication', async () => {
      const res = await request(app)
        .delete('/api/resume/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('deletes user resume and profile records while preserving user account and applications', async () => {
      const res = await request(app)
        .delete('/api/resume/me')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify Resume & Profile are deleted
      const resumeCount = await Resume.countDocuments({ userId: user._id });
      const profileCount = await CandidateProfile.countDocuments({ userId: user._id });
      expect(resumeCount).toBe(0);
      expect(profileCount).toBe(0);

      // Verify User account, Saved Jobs, and Applications are preserved
      const userExists = await User.findById(user._id);
      const savedCount = await SavedJob.countDocuments({ userId: user._id });
      const appCount = await Application.countDocuments({ userId: user._id });

      expect(userExists).toBeTruthy();
      expect(savedCount).toBe(1);
      expect(appCount).toBe(1);
    });
  });

  describe('DELETE /api/auth/account (Account Deletion & Total Erasure)', () => {
    test('requires password confirmation', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', [`token=${token}`])
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('rejects incorrect password', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', [`token=${token}`])
        .send({ password: 'WrongPassword999!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('successfully cascades deletion across all user data and clears cookie', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', [`token=${token}`])
        .send({ password: 'StrongPassword123!' })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify User and all associated documents are deleted
      const userExists = await User.findById(user._id);
      const resumeCount = await Resume.countDocuments({ userId: user._id });
      const profileCount = await CandidateProfile.countDocuments({ userId: user._id });
      const savedCount = await SavedJob.countDocuments({ userId: user._id });
      const appCount = await Application.countDocuments({ userId: user._id });

      expect(userExists).toBeNull();
      expect(resumeCount).toBe(0);
      expect(profileCount).toBe(0);
      expect(savedCount).toBe(0);
      expect(appCount).toBe(0);

      // Verify clear cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('token=;'))).toBe(true);
    });
  });
});
