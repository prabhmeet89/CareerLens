'use strict';
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const SavedJob = require('../models/SavedJob');
const Application = require('../models/Application');
const MatchExplanation = require('../models/MatchExplanation');
const Roadmap = require('../models/Roadmap');
const { calculateMatchScore } = require('../services/matchingEngine');
const { generateMatchExplanation } = require('../services/matchExplainer');
const { generateLearningRoadmap } = require('../services/roadmapGenerator');
const { getCache, setCache } = require('../config/redis');
const { recommendedKey } = require('../utils/cacheKeys');

// ─── Recommendation tuning ────────────────────────────────────────────────────
// The weighted match engine runs in JS and cannot be expressed as an index
// scan, so ranking has to score candidates in process. Bound that pool instead
// of loading the whole collection, and score a lightweight projection of only
// the fields calculateMatchScore() reads — this keeps the large `description`
// field out of memory for every listing except the page actually returned.
const CANDIDATE_POOL_CAP = parseInt(process.env.RECOMMENDATION_POOL_CAP, 10) || 1000;
const SCORING_FIELDS = 'title employmentType experienceRequired location skills postedAt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Decorate a list of job documents with match scores and isSaved flags.
 */
async function decorateJobs(jobs, userId) {
  let profile = null;
  let savedJobIds = new Set();
  let appliedJobIds = new Set();

  if (userId) {
    const [userProfile, saved, applied] = await Promise.all([
      CandidateProfile.findOne({ userId }).lean(),
      SavedJob.find({ userId }).lean(),
      Application.find({ userId }).lean(),
    ]);
    profile = userProfile;
    savedJobIds = new Set(saved.map((s) => s.jobId.toString()));
    appliedJobIds = new Set(applied.map((a) => a.jobId.toString()));
  }

  return jobs.map((job) => {
    // `_id` is an ObjectId on a fresh query but a plain string when the job
    // came back from the Redis cache — String() handles both.
    const jobIdStr = String(job.id || job._id);
    const formatted = {
      ...job,
      id: jobIdStr,
      isSaved: savedJobIds.has(jobIdStr),
      alreadyApplied: appliedJobIds.has(jobIdStr),
    };

    if (profile) {
      const matchResult = calculateMatchScore(profile, job);
      const totalReq = (job.skills || []).length;
      formatted.match = matchResult;
      formatted.readinessScore =
        totalReq === 0 ? null : Math.round((matchResult.matchedSkills.length / totalReq) * 100);
    }

    return formatted;
  });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

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

    // 1. Check Redis cache (page 1 only — deep pages skip cache)
    const cacheKey = recommendedKey(userId, page, limit);
    if (page === 1) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.status(200).json({ success: true, data: cached, fromCache: true });
      }
    }

    // 2. Fetch current candidate profile
    const profile = await CandidateProfile.findOne({ userId }).lean();
    if (!profile) {
      return res.status(200).json({
        success: true,
        message: 'No candidate profile found. Please upload a resume to view personalized AI job recommendations.',
        data: { jobs: [], hasProfile: false, total: 0, page: 1, limit, totalPages: 0 },
      });
    }

    // 3. Score a bounded pool of recent jobs using a lightweight projection.
    //    Newest-first ordering means the cap keeps the freshest listings when
    //    the collection outgrows CANDIDATE_POOL_CAP.
    const totalJobsInDb = await Job.countDocuments({});
    if (totalJobsInDb === 0) {
      return res.status(200).json({
        success: true,
        data: { jobs: [], hasProfile: true, total: 0, page: 1, limit, totalPages: 0 },
      });
    }

    const candidateJobs = await Job.find({}, SCORING_FIELDS)
      .sort({ postedAt: -1 })
      .limit(CANDIDATE_POOL_CAP)
      .lean();
    const truncated = totalJobsInDb > candidateJobs.length;

    // 4. Get saved & applied job IDs for decoration
    const [saved, applied] = await Promise.all([
      SavedJob.find({ userId }).lean(),
      Application.find({ userId }).lean(),
    ]);
    const savedJobIds = new Set(saved.map((s) => s.jobId.toString()));
    const appliedJobIds = new Set(applied.map((a) => a.jobId.toString()));

    // Score every candidate on its projection, then keep only the page's worth
    // of ids — we re-fetch full documents for those below.
    const scored = candidateJobs.map((job) => ({
      id: job._id.toString(),
      match: calculateMatchScore(profile, job),
      skillsLen: (job.skills || []).length,
    }));
    scored.sort((a, b) => b.match.score - a.match.score);

    const total = scored.length;
    const totalPages = Math.ceil(total / limit);
    const pageSlice = scored.slice(skip, skip + limit);

    // Hydrate full documents (incl. description) for just the returned page,
    // preserving the ranked order.
    const pageIds = pageSlice.map((s) => s.id);
    const fullDocs = await Job.find({ _id: { $in: pageIds } }).lean();
    const fullById = new Map(fullDocs.map((d) => [d._id.toString(), d]));

    const paginatedJobs = pageSlice
      .map(({ id, match, skillsLen }) => {
        const job = fullById.get(id);
        if (!job) return null;
        return {
          ...job,
          id,
          isSaved: savedJobIds.has(id),
          alreadyApplied: appliedJobIds.has(id),
          match,
          readinessScore:
            skillsLen === 0 ? null : Math.round((match.matchedSkills.length / skillsLen) * 100),
        };
      })
      .filter(Boolean);

    const responseData = {
      jobs: paginatedJobs,
      hasProfile: true,
      total,
      page,
      limit,
      totalPages,
      truncated,
    };

    if (truncated) {
      console.warn(
        `[Recommend] Job pool exceeds cap: ranked ${total} of ${totalJobsInDb} (cap ${CANDIDATE_POOL_CAP}).`
      );
    }

    // 5. Cache page 1 for 2 minutes
    if (page === 1) {
      await setCache(cacheKey, responseData, 120);
    }

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/jobs
 * @desc    Get jobs with search & filters (text index + AND-combined filters)
 * @access  Public (or Authenticated with match scores)
 */
const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, location, employmentType, experienceLevel } = req.query;

    // Deterministic cache key — sorted so ?search=x&page=1 and ?page=1&search=x
    // resolve to the same entry. Only non-user-specific params participate;
    // per-user decoration is applied after the cache lookup.
    const cacheKey = `jobs:search:${JSON.stringify({
      page,
      limit,
      search: (search || '').trim().toLowerCase(),
      location: location || '',
      employmentType: employmentType || '',
      experienceLevel: experienceLevel || '',
    })}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      // Decorate through the same path as a cache miss so an authenticated
      // user keeps match scores, readiness, isSaved and alreadyApplied.
      const decorated = await decorateJobs(cached.jobs, req.user?.id);
      return res.status(200).json({
        success: true,
        data: { ...cached, jobs: decorated },
        fromCache: true,
      });
    }

    // Build the filter portion of the query (AND-combined with any search term)
    const filters = {};

    if (location && location.trim() && location !== 'all') {
      // Support "remote", "on-site", "hybrid" as normalized filter values
      const locationMap = {
        remote: /remote/i,
        'on-site': /on.?site|onsite|in.?person/i,
        hybrid: /hybrid/i,
      };
      const locationRegex = locationMap[location.toLowerCase()];
      if (locationRegex) {
        filters.location = locationRegex;
      } else {
        filters.location = new RegExp(location.trim(), 'i');
      }
    }

    if (employmentType && employmentType !== 'all') {
      filters.employmentType = employmentType.toLowerCase();
    }

    if (experienceLevel && experienceLevel !== 'all') {
      filters.experienceRequired = new RegExp(experienceLevel.trim(), 'i');
    }

    // ── Resolve the effective search query ──────────────────────────────────
    // Prefer the weighted `job_text_search` index for relevance ranking. Fall
    // back to regex when $text yields nothing, because $text matches whole
    // tokens only — a partial query like "front" will never hit "frontend".
    const trimmedSearch = (search || '').trim();
    let query = filters;
    let useTextScore = false;
    let total = 0;

    if (trimmedSearch) {
      try {
        const textQuery = { ...filters, $text: { $search: trimmedSearch } };
        total = await Job.countDocuments(textQuery);
        if (total > 0) {
          query = textQuery;
          useTextScore = true;
        }
      } catch (textErr) {
        // Text index missing (e.g. a database created before it was declared)
        console.warn(`[Jobs] $text unavailable, falling back to regex: ${textErr.message}`);
        total = 0;
      }

      if (!useTextScore) {
        const sanitized = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(sanitized, 'i');
        query = {
          ...filters,
          $or: [{ title: regex }, { company: regex }, { description: regex }, { skills: regex }],
        };
        total = await Job.countDocuments(query);
      }
    } else {
      total = await Job.countDocuments(query);
    }

    // Rank by text relevance when the indexed path was used
    const sortOption = useTextScore
      ? { score: { $meta: 'textScore' }, postedAt: -1 }
      : { postedAt: -1 };
    const projection = useTextScore ? { score: { $meta: 'textScore' } } : {};

    const totalPages = Math.ceil(total / limit);

    const jobs = await Job.find(query, projection).sort(sortOption).skip(skip).limit(limit).lean();

    // Decorate with match scores if user is authenticated
    const decoratedJobs = await decorateJobs(jobs, req.user?.id);

    const responsePayload = { jobs: decoratedJobs, total, page, limit, totalPages };

    // Cache the raw (undecorated) listings for 60s. Per-user fields — match,
    // readinessScore, isSaved, alreadyApplied — are re-applied by
    // decorateJobs() on every read, so nothing user-specific is ever cached.
    const cacheableJobs = jobs.map((j) => ({ ...j, id: j._id.toString() }));
    await setCache(cacheKey, { jobs: cacheableJobs, total, page, limit, totalPages }, 60);

    return res.status(200).json({ success: true, data: responsePayload });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job details (with optional match data if authenticated)
 * @access  Public (or Authenticated)
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    const formattedJob = { ...job, id: job._id.toString() };

    if (req.user?.id) {
      const userId = req.user.id;
      const [userProfile, savedEntry, applicationEntry] = await Promise.all([
        CandidateProfile.findOne({ userId }).lean(),
        SavedJob.findOne({ userId, jobId: id }).lean(),
        Application.findOne({ userId, jobId: id }).lean(),
      ]);

      formattedJob.isSaved = !!savedEntry;
      formattedJob.alreadyApplied = !!applicationEntry;
      formattedJob.application = applicationEntry
        ? {
            id: applicationEntry._id.toString(),
            status: applicationEntry.status,
            appliedAt: applicationEntry.appliedAt,
            notes: applicationEntry.notes,
          }
        : null;

      if (userProfile) {
        const matchResult = calculateMatchScore(userProfile, job);
        const totalReq = (job.skills || []).length;
        formattedJob.match = matchResult;
        formattedJob.readinessScore =
          totalReq === 0 ? null : Math.round((matchResult.matchedSkills.length / totalReq) * 100);
      }
    }

    return res.status(200).json({ success: true, data: formattedJob });
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
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    const matchResult = calculateMatchScore(userProfile, job);
    const profileVersion = userProfile.updatedAt || userProfile.createdAt || new Date();

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

    const aiExplanation = await generateMatchExplanation({
      candidateProfile: userProfile,
      job,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      matchScore: matchResult.score,
    });

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
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    const matchResult = calculateMatchScore(userProfile, job);
    const profileVersion = userProfile.updatedAt || userProfile.createdAt || new Date();

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

    const aiRoadmap = await generateLearningRoadmap({
      missingSkills: matchResult.missingSkills,
      job,
      candidateProfile: userProfile,
      matchedSkills: matchResult.matchedSkills,
    });

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
