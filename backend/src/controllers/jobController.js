const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const MatchExplanation = require('../models/MatchExplanation');
const Roadmap = require('../models/Roadmap');
const { calculateMatchScore } = require('../services/matchingEngine');
const { generateMatchExplanation } = require('../services/matchExplainer');
const { generateLearningRoadmap } = require('../services/roadmapGenerator');

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
      const totalReq = (job.skills || []).length;
      const readiness =
        totalReq === 0
          ? 100
          : Math.round((matchResult.matchedSkills.length / totalReq) * 100);

      return {
        ...job,
        id: job._id.toString(),
        match: matchResult,
        readinessScore: readiness,
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
        const matchResult = calculateMatchScore(userProfile, job);
        const totalReq = (job.skills || []).length;
        formatted.match = matchResult;
        formatted.readinessScore =
          totalReq === 0
            ? 100
            : Math.round((matchResult.matchedSkills.length / totalReq) * 100);
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

    // If authenticated, compute match score and readiness score
    if (req.user?.id) {
      const userProfile = await CandidateProfile.findOne({ userId: req.user.id }).lean();
      if (userProfile) {
        const matchResult = calculateMatchScore(userProfile, job);
        const totalReq = (job.skills || []).length;
        formattedJob.match = matchResult;
        formattedJob.readinessScore =
          totalReq === 0
            ? 100
            : Math.round((matchResult.matchedSkills.length / totalReq) * 100);
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

/**
 * @route   GET /api/jobs/:id/explain
 * @desc    Get or generate AI Match Explanation for current candidate & job (cached in MongoDB)
 * @access  Protected
 */
const getMatchExplanation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: jobId } = req.params;

    // 1. Fetch Candidate Profile & Job
    const userProfile = await CandidateProfile.findOne({ userId }).lean();
    if (!userProfile) {
      return res.status(200).json({
        success: true,
        message: 'Please upload a resume first to generate personalized match explanations.',
        data: null,
      });
    }

    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found.',
      });
    }

    // 2. Compute matching engine score & skill overlap
    const matchResult = calculateMatchScore(userProfile, job);
    const profileVersion = userProfile.updatedAt || userProfile.createdAt || new Date();

    // 3. Check MongoDB Cache
    const cachedExplanation = await MatchExplanation.findOne({ userId, jobId }).lean();

    const isCacheFresh =
      cachedExplanation &&
      cachedExplanation.candidateProfileVersion &&
      new Date(cachedExplanation.candidateProfileVersion).getTime() >= new Date(profileVersion).getTime();

    if (isCacheFresh) {
      return res.status(200).json({
        success: true,
        data: {
          strengths: cachedExplanation.strengths,
          gaps: cachedExplanation.gaps,
          verdict: cachedExplanation.verdict,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          matchScore: matchResult.score,
          generatedAt: cachedExplanation.generatedAt,
          cached: true,
        },
      });
    }

    // 4. Cache is missing or stale -> Generate fresh explanation via AI service
    const aiExplanation = await generateMatchExplanation({
      candidateProfile: userProfile,
      job,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      matchScore: matchResult.score,
    });

    // 5. Upsert in MongoDB Cache
    const saved = await MatchExplanation.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          candidateProfileVersion: profileVersion,
          strengths: aiExplanation.strengths,
          gaps: aiExplanation.gaps,
          verdict: aiExplanation.verdict,
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        strengths: saved.strengths,
        gaps: saved.gaps,
        verdict: saved.verdict,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        matchScore: matchResult.score,
        generatedAt: saved.generatedAt,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/jobs/:id/roadmap
 * @route   GET /api/jobs/:id/roadmap
 * @desc    Get or generate tailored AI Learning Roadmap for missing skills
 * @access  Protected
 */
const getOrGenerateRoadmap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: jobId } = req.params;
    const forceRegenerate = req.query.force === 'true' || req.body?.force === true;

    // 1. Fetch Candidate Profile & Job
    const userProfile = await CandidateProfile.findOne({ userId }).lean();
    if (!userProfile) {
      return res.status(200).json({
        success: true,
        message: 'Please upload a resume first to generate a personalized learning roadmap.',
        data: null,
      });
    }

    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found.',
      });
    }

    // 2. Compute matching engine skill overlap
    const matchResult = calculateMatchScore(userProfile, job);
    const profileVersion = userProfile.updatedAt || userProfile.createdAt || new Date();

    // 3. Check MongoDB Cache (unless force refresh requested)
    if (!forceRegenerate) {
      const cachedRoadmap = await Roadmap.findOne({ userId, jobId }).lean();
      const isCacheFresh =
        cachedRoadmap &&
        cachedRoadmap.candidateProfileVersion &&
        new Date(cachedRoadmap.candidateProfileVersion).getTime() >= new Date(profileVersion).getTime();

      if (isCacheFresh) {
        return res.status(200).json({
          success: true,
          data: {
            totalWeeks: cachedRoadmap.totalWeeks,
            weeks: cachedRoadmap.weeks,
            generatedAt: cachedRoadmap.generatedAt,
            jobTitle: job.title,
            jobCompany: job.company,
            missingSkills: matchResult.missingSkills,
            cached: true,
          },
        });
      }
    }

    // 4. Cache is missing, stale, or regeneration forced -> Call AI Roadmap service
    const aiRoadmap = await generateLearningRoadmap({
      missingSkills: matchResult.missingSkills,
      job,
      candidateProfile: userProfile,
      matchedSkills: matchResult.matchedSkills,
    });

    // 5. Upsert in MongoDB Cache
    const saved = await Roadmap.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          candidateProfileVersion: profileVersion,
          totalWeeks: aiRoadmap.totalWeeks,
          weeks: aiRoadmap.weeks,
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        totalWeeks: saved.totalWeeks,
        weeks: saved.weeks,
        generatedAt: saved.generatedAt,
        jobTitle: job.title,
        jobCompany: job.company,
        missingSkills: matchResult.missingSkills,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendedJobs,
  getJobs,
  getJobById,
  getMatchExplanation,
  getOrGenerateRoadmap,
};
