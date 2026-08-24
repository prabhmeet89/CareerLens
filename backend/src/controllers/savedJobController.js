'use strict';
const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const { calculateMatchScore } = require('../services/matchingEngine');
const { invalidateRecommendations } = require('../utils/cacheKeys');

/**
 * @route   POST /api/jobs/:id/save
 * @desc    Toggle save/unsave a job for the authenticated user
 * @access  Protected
 */
const toggleSaveJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    // Verify job exists
    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    // Check if already saved
    const existing = await SavedJob.findOne({ userId, jobId });
    if (existing) {
      // Unsave
      await SavedJob.deleteOne({ _id: existing._id });
      await invalidateRecommendations(userId);
      return res.status(200).json({
        success: true,
        saved: false,
        message: `"${job.title}" removed from your saved jobs.`,
      });
    } else {
      // Save
      await SavedJob.create({ userId, jobId });
      await invalidateRecommendations(userId);
      return res.status(200).json({
        success: true,
        saved: true,
        message: `"${job.title}" saved to your jobs!`,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/saved-jobs
 * @desc    Get paginated list of saved jobs for the authenticated user
 * @access  Protected
 */
const getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await SavedJob.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    const savedJobs = await SavedJob.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('jobId')
      .lean();

    // Get candidate profile for match scoring
    const profile = await CandidateProfile.findOne({ userId }).lean();

    const jobs = savedJobs
      .filter((s) => s.jobId) // Filter out any orphaned saves (deleted jobs)
      .map((s) => {
        const job = s.jobId;
        const formatted = {
          ...job,
          id: job._id.toString(),
          savedAt: s.createdAt,
          isSaved: true,
        };
        if (profile) {
          const matchResult = calculateMatchScore(profile, job);
          const totalReq = (job.skills || []).length;
          formatted.match = matchResult;
          formatted.readinessScore =
            totalReq === 0 ? 100 : Math.round((matchResult.matchedSkills.length / totalReq) * 100);
        }
        return formatted;
      });

    return res.status(200).json({
      success: true,
      data: { jobs, total, page, limit, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleSaveJob, getSavedJobs };
