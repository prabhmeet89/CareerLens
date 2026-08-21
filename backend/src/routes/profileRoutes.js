const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');
const CandidateProfile = require('../models/CandidateProfile');
const Resume = require('../models/Resume');
const User = require('../models/User');

// All profile routes require authentication
router.use(authMiddleware);

// Get current user's profile
router.get('/me', profileController.getMyProfile);

// Development seed endpoint for instant testing and UI preview
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-seed', async (req, res) => {
    try {
      const userId = req.user.id;

      // Create a mock resume document
      const resume = await Resume.create({
        userId,
        fileUrl: '/uploads/sample_resume.pdf',
        originalFileName: 'Alex_Rivera_Resume.pdf',
        fileSize: 1024 * 350,
        status: 'processed',
      });

      // Upsert candidate profile
      const profile = await CandidateProfile.findOneAndUpdate(
        { userId },
        {
          $set: {
            resumeId: resume._id,
            skills: [
              'React',
              'TypeScript',
              'Node.js',
              'Express',
              'Python',
              'MongoDB',
              'PostgreSQL',
              'Docker',
              'AWS',
              'Tailwind CSS',
              'REST APIs',
              'Git',
            ],
            education: [
              {
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                institution: 'Stanford University School of Engineering',
              },
            ],
            projects: [
              {
                name: 'CareerLens AI Job Matcher',
                technologies: ['React', 'Node.js', 'Google Gemini', 'MongoDB', 'Tailwind CSS'],
                description:
                  'Engineered an AI-powered student career recommendation platform featuring secure cookie-based auth, PDF extraction with pdf-parse, and Gemini AI profiling.',
              },
              {
                name: 'Distributed Cloud Microservices',
                technologies: ['Python', 'Docker', 'AWS', 'Redis', 'PostgreSQL'],
                description:
                  'Architected high-throughput resilient backend services handling 10k+ requests/sec with automated failover and sub-30ms latency.',
              },
            ],
            experience: [
              {
                role: 'Software Engineering Intern',
                company: 'Tech Innovations Lab',
                duration: 'Summer 2025 (3 mos)',
              },
            ],
            preferredRoles: [
              'Full Stack Developer',
              'Frontend Software Engineer',
              'Software Engineering Intern',
            ],
          },
        },
        { new: true, upsert: true }
      );

      await User.findByIdAndUpdate(userId, {
        tagline: 'Full Stack Developer',
      });

      return res.status(200).json({
        success: true,
        message: 'Dev profile seeded successfully.',
        data: profile,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
}

module.exports = router;
