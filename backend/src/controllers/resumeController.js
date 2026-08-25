const Resume = require('../models/Resume');
const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');
const MatchExplanation = require('../models/MatchExplanation');
const Roadmap = require('../models/Roadmap');
const { extractTextFromPDF } = require('../services/pdfExtractor');
const { analyzeResumeWithAI } = require('../services/aiResumeAnalyzer');
const { invalidateRecommendations } = require('../utils/cacheKeys');
const { deleteStoredFile } = require('../config/storage');

/**
 * @route   POST /api/resume/upload
 * @desc    Upload a single PDF resume
 * @access  Protected
 */
const uploadResume = async (req, res, next) => {
  try {
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided.',
      });
    }

    // Determine public or local file URL
    const fileUrl = file.path && file.path.startsWith('http')
      ? file.path // Cloudinary URL
      : `/uploads/${file.filename}`;

    const filePath = file.path; // Local disk path if available

    const newResume = await Resume.create({
      userId: userId,
      fileUrl: fileUrl,
      filePath: filePath,
      originalFileName: file.originalname,
      fileSize: file.size,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully. Ready for AI analysis.',
      data: {
        resumeId: newResume._id.toString(),
        originalFileName: newResume.originalFileName,
        fileUrl: newResume.fileUrl,
        fileSize: newResume.fileSize,
        status: newResume.status,
        uploadedAt: newResume.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/resume/:id/analyze
 * @desc    Extract text & perform AI analysis with Google Gemini on uploaded resume
 * @access  Protected
 */
const analyzeResume = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  let resume;
  try {
    resume = await Resume.findOne({ _id: id, userId: userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume document not found or access unauthorized.',
      });
    }

    // Mark status as processing
    resume.status = 'processing';
    resume.errorMessage = null;
    await resume.save();

    // 1. Extract raw text from PDF
    console.log(`[ResumeController] Extracting text from resume: ${resume.originalFileName}...`);
    const extractedText = await extractTextFromPDF({
      filePath: resume.filePath,
      fileUrl: resume.fileUrl,
    });

    // 2. Perform AI Analysis with Google Gemini
    console.log(`[ResumeController] Analyzing extracted text (${extractedText.length} chars) with Gemini AI...`);
    const profileData = await analyzeResumeWithAI(extractedText);

    // 3. Upsert CandidateProfile document for the authenticated user
    const updatedProfile = await CandidateProfile.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          resumeId: resume._id,
          skills: profileData.skills,
          education: profileData.education,
          projects: profileData.projects,
          experience: profileData.experience,
          preferredRoles: profileData.preferredRoles,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // 4. Update user tagline to top preferred role if available
    if (profileData.preferredRoles && profileData.preferredRoles.length > 0) {
      await User.findByIdAndUpdate(userId, {
        tagline: profileData.preferredRoles[0],
      });
    }

    // 5. Mark resume status as processed
    resume.status = 'processed';
    resume.errorMessage = null;
    await resume.save();

    // 6. The profile that drives match scoring just changed — drop any cached
    // recommendations so the next request re-ranks against the new skills.
    await invalidateRecommendations(userId);

    console.log(`[ResumeController] Successfully processed profile for user: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Resume analyzed and candidate profile generated successfully.',
      data: {
        profile: updatedProfile,
        resume: {
          id: resume._id.toString(),
          status: resume.status,
          originalFileName: resume.originalFileName,
          uploadedAt: resume.uploadedAt,
        },
      },
    });
  } catch (error) {
    console.error(`[ResumeController Error] Processing failed for resume ${id}:`, error.message);

    if (resume) {
      resume.status = 'failed';
      resume.errorMessage = error.message;
      await resume.save();
    }

    return res.status(422).json({
      success: false,
      message: error.message || 'Failed to analyze resume. Please try again with another file.',
      data: {
        resumeId: id,
        status: 'failed',
      },
    });
  }
};

/**
 * @route   GET /api/resume/:id/status
 * @desc    Get status of an uploaded resume
 * @access  Protected
 */
const getResumeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resume = await Resume.findOne({ _id: id, userId: userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume document not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: resume._id.toString(),
        status: resume.status,
        errorMessage: resume.errorMessage,
        originalFileName: resume.originalFileName,
        fileUrl: resume.fileUrl,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/resume/me
 * @desc    Delete user's uploaded resume file, candidate profile, and derived AI data
 * @access  Protected
 */
const deleteResumeAndProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Find all resumes uploaded by user and remove files from disk/Cloudinary
    const resumes = await Resume.find({ userId });
    for (const r of resumes) {
      if (r.fileUrl) {
        await deleteStoredFile(r.fileUrl);
      }
    }

    // 2. Delete database records
    await Promise.all([
      Resume.deleteMany({ userId }),
      CandidateProfile.deleteMany({ userId }),
      MatchExplanation.deleteMany({ userId }),
      Roadmap.deleteMany({ userId }),
    ]);

    // 3. Clear cached recommendations
    await invalidateRecommendations(userId);

    return res.status(200).json({
      success: true,
      message: 'Your resume and extracted candidate profile data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  analyzeResume,
  getResumeStatus,
  deleteResumeAndProfile,
};
