'use strict';
const request = require('supertest');
const { app } = require('../src/server');
const { connectTestDB, closeTestDB, clearTestDB, createTestUser, createTestToken } = require('./testSetup');
const Job = require('../src/models/Job');
const CandidateProfile = require('../src/models/CandidateProfile');

describe('Jobs & Search / Filter API (/api/jobs)', () => {
  let user;
  let token;
  let testJobs = [];

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    user = await createTestUser({ email: 'jobs.tester@berkeley.edu' });
    token = createTestToken(user._id);

    // Seed 4 diverse test jobs
    testJobs = await Job.insertMany([
      {
        title: 'Frontend Engineer Intern',
        company: 'Vercel',
        description: 'Build lightning-fast React and Next.js interfaces with TypeScript and Tailwind.',
        location: 'Remote',
        employmentType: 'internship',
        experienceRequired: '0-1 years',
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        salary: '$45 - $55 / hr',
        postedAt: new Date(Date.now() - 10000),
      },
      {
        title: 'Backend Systems Engineer',
        company: 'Stripe',
        description: 'Design high-throughput payment infrastructure with Node.js, Go, and PostgreSQL.',
        location: 'San Francisco, CA (Hybrid)',
        employmentType: 'full-time',
        experienceRequired: '1-3 years',
        skills: ['Node.js', 'Go', 'PostgreSQL', 'Docker', 'AWS'],
        salary: '$130,000 - $165,000 / yr',
        postedAt: new Date(Date.now() - 20000),
      },
      {
        title: 'Full Stack Developer',
        company: 'Retool',
        description: 'Create internal tool platforms using React, Node.js, and MongoDB.',
        location: 'Remote',
        employmentType: 'full-time',
        experienceRequired: '0-2 years',
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
        salary: '$110,000 - $140,000 / yr',
        postedAt: new Date(Date.now() - 30000),
      },
      {
        title: 'Machine Learning Engineering Intern',
        company: 'Scale AI',
        description: 'Develop data annotation pipelines using Python and PyTorch.',
        location: 'New York, NY (On-site)',
        employmentType: 'internship',
        experienceRequired: '0-1 years',
        skills: ['Python', 'PyTorch', 'Docker'],
        salary: '$50 - $60 / hr',
        postedAt: new Date(Date.now() - 40000),
      },
    ]);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('GET /api/jobs (General Listing & Filters)', () => {
    test('returns all jobs paginated when no query parameters provided', async () => {
      const res = await request(app)
        .get('/api/jobs?page=1&limit=10')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(4);
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.page).toBe(1);
      // Description is excluded from listing response for payload optimization
      expect(res.body.data.jobs[0].description).toBeUndefined();
    });

    test('filters jobs by employmentType (e.g. internship only)', async () => {
      const res = await request(app)
        .get('/api/jobs?employmentType=internship')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(2);
      expect(res.body.data.jobs.every((j) => j.employmentType === 'internship')).toBe(true);
    });

    test('filters jobs by location (e.g. remote only)', async () => {
      const res = await request(app)
        .get('/api/jobs?location=remote')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(2); // Vercel and Retool
      expect(res.body.data.jobs.every((j) => /remote/i.test(j.location))).toBe(true);
    });

    test('combines search keyword and filters using AND logic', async () => {
      const res = await request(app)
        .get('/api/jobs?search=React&location=remote&employmentType=internship')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(1);
      expect(res.body.data.jobs[0].company).toBe('Vercel');
    });

    test('filters jobs by workArrangement (e.g. remote, hybrid)', async () => {
      const res = await request(app)
        .get('/api/jobs?workArrangement=remote')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(2);
    });

    test('supports multi-value workArrangement filter (e.g. remote,hybrid)', async () => {
      const res = await request(app)
        .get('/api/jobs?workArrangement=remote,hybrid')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(3); // Vercel, Stripe, Retool
    });

    test('filters jobs by salary range overlap with numeric fields', async () => {
      // Add test job with numeric salary
      await Job.create({
        title: 'Senior React Architect',
        company: 'Meta',
        description: 'Lead web architecture.',
        location: 'Remote',
        employmentType: 'full-time',
        workArrangement: 'remote',
        skills: ['React'],
        minSalary: 150000,
        maxSalary: 200000,
        postedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/jobs?minSalary=160000&maxSalary=220000')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(1);
      expect(res.body.data.jobs[0].company).toBe('Meta');
    });

    test('filters jobs by datePosted cutoff (e.g. past 7 days)', async () => {
      const res = await request(app)
        .get('/api/jobs?datePosted=7d')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBeGreaterThan(0);
    });

    test('safely escapes special regex metacharacters in search query', async () => {
      const res = await request(app)
        .get('/api/jobs?search=React+(TypeScript)')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('returns empty array when search query matches no jobs', async () => {
      const res = await request(app)
        .get('/api/jobs?search=NonExistentSkill12345')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(0);
      expect(res.body.data.total).toBe(0);
    });
  });

  describe('GET /api/jobs/:id', () => {
    test('returns single job details by valid ID', async () => {
      const targetJob = testJobs[0];

      const res = await request(app)
        .get(`/api/jobs/${targetJob._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Frontend Engineer Intern');
      expect(res.body.data.company).toBe('Vercel');
      expect(res.body.data.description).toBeDefined();
    });

    test('returns 404 Not Found for non-existent job ID', async () => {
      const nonExistentId = '6a8341dc18d707060a94d399';

      const res = await request(app)
        .get(`/api/jobs/${nonExistentId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    test('decorates single job with match score and readiness score when authenticated', async () => {
      // Seed candidate profile
      await CandidateProfile.create({
        userId: user._id,
        skills: ['React', 'TypeScript', 'Next.js'],
        education: [{ degree: 'B.S.', field: 'CS' }],
        projects: [{ name: 'React App', technologies: ['React'] }],
        experience: [],
        preferredRoles: ['Frontend Engineer'],
      });

      const targetJob = testJobs[0];

      const res = await request(app)
        .get(`/api/jobs/${targetJob._id}`)
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.match).toBeDefined();
      expect(res.body.data.match.score).toBeGreaterThan(0);
      expect(res.body.data.readinessScore).toBeDefined();
    });
  });

  describe('GET /api/jobs/recommended', () => {
    test('returns 401 Unauthorized when not logged in', async () => {
      await request(app)
        .get('/api/jobs/recommended')
        .expect(401);
    });

    test('returns empty state with hasProfile: false when candidate has not uploaded resume', async () => {
      const res = await request(app)
        .get('/api/jobs/recommended')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.hasProfile).toBe(false);
      expect(res.body.data.jobs).toEqual([]);
    });

    test('returns ranked jobs sorted descending by match score when candidate has profile', async () => {
      // Seed candidate profile with React & TypeScript
      await CandidateProfile.create({
        userId: user._id,
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        education: [{ degree: 'B.S.', field: 'CS' }],
        projects: [{ name: 'Vercel Clone', technologies: ['React', 'Next.js'] }],
        experience: [],
        preferredRoles: ['Frontend Engineer'],
      });

      const res = await request(app)
        .get('/api/jobs/recommended')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.hasProfile).toBe(true);
      expect(res.body.data.jobs.length).toBe(4);

      // Highest matching job (Vercel with 100% skill match) should be first
      expect(res.body.data.jobs[0].company).toBe('Vercel');
      expect(res.body.data.jobs[0].match.score).toBeGreaterThanOrEqual(res.body.data.jobs[1].match.score);
      // Verify description is projected out of listing cards to minimize payload
      expect(res.body.data.jobs[0].description).toBeUndefined();
    });
  });
});
