'use strict';
const request = require('supertest');
const { app } = require('../src/server');
const { connectTestDB, closeTestDB, clearTestDB, createTestUser, createTestToken } = require('./testSetup');
const CandidateProfile = require('../src/models/CandidateProfile');
const Resume = require('../src/models/Resume');

// Mock PDF text extractor so tests do not depend on physical filesystem files
jest.mock('../src/services/pdfExtractor', () => ({
  extractTextFromPDF: jest.fn().mockResolvedValue('Maya Lin Stanford University CS skills React TypeScript Node.js MongoDB Python AWS'),
}));

// Mock Google Gemini AI resume analyzer to ensure zero external API calls
jest.mock('../src/services/aiResumeAnalyzer', () => ({
  analyzeResumeWithAI: jest.fn().mockResolvedValue({
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Python', 'AWS'],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'Stanford University',
        graduationYear: '2026',
      },
    ],
    projects: [
      {
        name: 'CareerLens Career Matcher',
        technologies: ['React', 'Node.js', 'MongoDB'],
        description: 'Engineered student AI career platform extracting verified skills from PDF resumes.',
      },
    ],
    experience: [
      {
        role: 'Software Engineering Intern',
        company: 'Innovate Labs',
        duration: 'Summer 2025 (3 mos)',
        description: 'Developed scalable microservices with 99.9% uptime.',
      },
    ],
    preferredRoles: ['Full Stack Developer', 'Software Engineer'],
    summary: 'Senior CS student passionate about building scalable full-stack applications.',
  }),
}));

describe('Resume Upload & AI Profile Extraction API (/api/resume)', () => {
  let user;
  let token;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    user = await createTestUser({ email: 'student.uploader@stanford.edu' });
    token = createTestToken(user._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/resume/upload', () => {
    test('successfully uploads valid PDF resume and returns resumeId', async () => {
      // Create minimal valid PDF buffer (starts with %PDF)
      const validPdfBuffer = Buffer.from('%PDF-1.4\n%Minimal valid test PDF\n%%EOF');

      const res = await request(app)
        .post('/api/resume/upload')
        .set('Cookie', [`token=${token}`])
        .attach('resume', validPdfBuffer, 'Student_Resume.pdf')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.resumeId).toBeDefined();
      expect(res.body.data.originalFileName).toBe('Student_Resume.pdf');

      // Verify Resume document in DB
      const resumeDoc = await Resume.findById(res.body.data.resumeId);
      expect(resumeDoc).toBeDefined();
      expect(resumeDoc.userId.toString()).toBe(user._id.toString());
    });

    test('rejects unauthenticated upload request with 401 Unauthorized', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4\n%Minimal valid test PDF\n%%EOF');

      const res = await request(app)
        .post('/api/resume/upload')
        .attach('resume', validPdfBuffer, 'Resume.pdf')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('rejects non-PDF file MIME types with 400 Bad Request', async () => {
      const textBuffer = Buffer.from('Just plain text content, not a PDF.');

      const res = await request(app)
        .post('/api/resume/upload')
        .set('Cookie', [`token=${token}`])
        .attach('resume', textBuffer, 'notes.txt')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only pdf/i);
    });

    test('rejects request with missing file payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/resume/upload')
        .set('Cookie', [`token=${token}`])
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/resume/:id/analyze', () => {
    test('successfully extracts and persists CandidateProfile from uploaded resume', async () => {
      // Create a test resume record in MongoDB
      const resume = await Resume.create({
        userId: user._id,
        originalFileName: 'Test_Resume.pdf',
        fileUrl: '/uploads/Test_Resume.pdf',
        fileSize: 1024,
        status: 'pending',
      });

      const res = await request(app)
        .post(`/api/resume/${resume._id}/analyze`)
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.skills).toContain('React');
      expect(res.body.data.profile.skills).toContain('TypeScript');

      // Verify CandidateProfile document exists in DB
      const profile = await CandidateProfile.findOne({ userId: user._id });
      expect(profile).toBeDefined();
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.projects.length).toBe(1);
    });
  });
});
