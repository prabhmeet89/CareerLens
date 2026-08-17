const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const { calculateMatchScore } = require('../services/matchingEngine');

/**
 * @route   GET /api/jobs/recommended
 * @desc    Get AI-ranked recommended jobs for current authenticated user
 * @access  Protected
 */
const getRecommendedJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 1. Fetch current candidate profile
    const profile = await CandidateProfile.findOne({ userId }).lean();

    // If user has no candidate profile yet, return friendly empty state without error
    if (!profile) {
      return res.status(200).json({
        success: true,
        message: 'No candidate profile found. Please upload a resume to view personalized AI job recommendations.',
        data: {
          jobs: [],
          hasProfile: false,
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
        },
      });
    }

    // 2. Fetch all jobs in database
    const allJobs = await Job.find({}).sort({ postedAt: -1 }).lean();

    if (allJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs currently available in the database.',
        data: {
          jobs: [],
          hasProfile: true,
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
        },
      });
    }

    // 3. Compute match scores for every job using pure matching engine
    const scoredJobs = allJobs.map((job) => {
      const matchResult = calculateMatchScore(profile, job);
      return {
        ...job,
        id: job._id.toString(),
        match: matchResult,
      };
    });

    // 4. Sort descending by match score (highest score first)
    scoredJobs.sort((a, b) => b.match.score - a.match.score);

    // 5. Apply pagination
    const total = scoredJobs.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedJobs = scoredJobs.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: {
        jobs: paginatedJobs,
        hasProfile: true,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/jobs
 * @desc    Get general listing of all jobs (paginated)
 * @access  Public (or Authenticated)
 */
const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Job.countDocuments({});
    const totalPages = Math.ceil(total / limit);

    const jobs = await Job.find({})
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Check if user is authenticated and has a profile to optionally decorate jobs with match scores
    let userProfile = null;
    if (req.user?.id) {
      userProfile = await CandidateProfile.findOne({ userId: req.user.id }).lean();
    }

    const enhancedJobs = jobs.map((job) => {
      const formatted = {
        ...job,
        id: job._id.toString(),
      };
      if (userProfile) {
        formatted.match = calculateMatchScore(userProfile, job);
      }
      return formatted;
    });

    return res.status(200).json({
      success: true,
      data: {
        jobs: enhancedJobs,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job details
 * @access  Public (or Authenticated)
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).lean();
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found.',
      });
    }

    const formattedJob = {
      ...job,
      id: job._id.toString(),
    };

    // If authenticated, compute match score for this specific job
    if (req.user?.id) {
      const userProfile = await CandidateProfile.findOne({ userId: req.user.id }).lean();
      if (userProfile) {
        formattedJob.match = calculateMatchScore(userProfile, job);
      }
    }

    return res.status(200).json({
      success: true,
      data: formattedJob,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendedJobs,
  getJobs,
  getJobById,
};
