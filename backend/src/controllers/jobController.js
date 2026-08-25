'use strict';
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const SavedJob = require('../models/SavedJob');
const Application = require('../models/Application');
const MatchExplanation = require('../models/MatchExplanation');
const Roadmap = require('../models/Roadmap');
const { normalizeRoadmapWeeks, calculateRoadmapProgress } = require('../models/Roadmap');
const { calculateMatchScore } = require('../services/matchingEngine');
const { generateMatchExplanation, AI_DISCLOSURE } = require('../services/matchExplainer');
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const {
      search,
      location,
      employmentType,
      workArrangement,
      minSalary,
      maxSalary,
      datePosted,
      experienceLevel,
    } = req.query;

    // Normalize salary parameters
    const parsedMinSalary =
      minSalary !== undefined && minSalary !== '' && !isNaN(Number(minSalary)) && Number(minSalary) >= 0
        ? Number(minSalary)
        : null;
    const parsedMaxSalary =
      maxSalary !== undefined && maxSalary !== '' && !isNaN(Number(maxSalary)) && Number(maxSalary) >= 0
        ? Number(maxSalary)
        : null;

    // Normalize work arrangements
    const rawArrangements = Array.isArray(workArrangement)
      ? workArrangement
      : typeof workArrangement === 'string'
      ? workArrangement.split(',')
      : [];
    const validArrangements = rawArrangements
      .map((w) => w.trim().toLowerCase())
      .filter((w) => ['remote', 'hybrid', 'on-site'].includes(w));

    // Deterministic cache key
    const cacheKey = `jobs:search:${JSON.stringify({
      page,
      limit,
      search: (search || '').trim().toLowerCase(),
      location: (location || '').trim().toLowerCase(),
      employmentType: (employmentType || '').trim().toLowerCase(),
      workArrangement: [...validArrangements].sort().join(','),
      minSalary: parsedMinSalary,
      maxSalary: parsedMaxSalary,
      datePosted: (datePosted || '').trim().toLowerCase(),
      experienceLevel: (experienceLevel || '').trim().toLowerCase(),
    })}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      const decorated = await decorateJobs(cached.jobs, req.user?.id);
      return res.status(200).json({
        success: true,
        data: { ...cached, jobs: decorated },
        fromCache: true,
      });
    }

    // Build the filter portion of the query (AND-combined with any search term)
    const andConditions = [];

    // 1. Location Filter
    if (location && location.trim() && location !== 'all') {
      const locationMap = {
        remote: /remote/i,
        'on-site': /on.?site|onsite|in.?person/i,
        hybrid: /hybrid/i,
      };
      const locationRegex = locationMap[location.toLowerCase()];
      if (locationRegex) {
        andConditions.push({ location: locationRegex });
      } else {
        const sanitizedLoc = location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        andConditions.push({ location: new RegExp(sanitizedLoc, 'i') });
      }
    }

    // 2. Employment Type Filter
    if (employmentType && employmentType !== 'all') {
      andConditions.push({ employmentType: employmentType.toLowerCase().trim() });
    }

    // 3. Work Arrangement Filter (Remote / Hybrid / On-site)
    if (validArrangements.length > 0) {
      const arrangementRegexes = validArrangements.map((a) => {
        if (a === 'remote') return /remote|wfh/i;
        if (a === 'hybrid') return /hybrid/i;
        if (a === 'on-site') return /on.?site|in.?person/i;
        return new RegExp(a, 'i');
      });

      andConditions.push({
        $or: [
          { workArrangement: { $in: validArrangements } },
          { location: { $in: arrangementRegexes } },
        ],
      });
    }

    // 4. Salary Range Overlap Filter
    if (parsedMinSalary !== null || parsedMaxSalary !== null) {
      const salaryConditions = [];

      if (parsedMinSalary !== null && parsedMaxSalary !== null) {
        // Range overlap: Job upper >= user min AND job lower <= user max
        salaryConditions.push({
          $or: [
            { maxSalary: { $gte: parsedMinSalary } },
            { minSalary: { $gte: parsedMinSalary } },
          ],
        });
        salaryConditions.push({
          $or: [
            { minSalary: { $lte: parsedMaxSalary } },
            { maxSalary: { $lte: parsedMaxSalary } },
          ],
        });
      } else if (parsedMinSalary !== null) {
        salaryConditions.push({
          $or: [
            { maxSalary: { $gte: parsedMinSalary } },
            { minSalary: { $gte: parsedMinSalary } },
          ],
        });
      } else if (parsedMaxSalary !== null) {
        salaryConditions.push({
          $or: [
            { minSalary: { $lte: parsedMaxSalary } },
            { maxSalary: { $lte: parsedMaxSalary } },
          ],
        });
      }

      // Exclude jobs without numeric salary when salary filter is active
      salaryConditions.push({
        $or: [
          { minSalary: { $ne: null, $gt: 0 } },
          { maxSalary: { $ne: null, $gt: 0 } },
        ],
      });

      andConditions.push(...salaryConditions);
    }

    // 5. Date Posted Filter (1d, 3d, 7d, 14d, 30d)
    if (datePosted && datePosted !== 'all') {
      const DATE_POSTED_MAP = {
        '1d': 1,
        '24h': 1,
        '3d': 3,
        '7d': 7,
        '1w': 7,
        '14d': 14,
        '2w': 14,
        '30d': 30,
        '1m': 30,
      };
      const days = DATE_POSTED_MAP[datePosted.toLowerCase().trim()];
      if (days) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        andConditions.push({ postedAt: { $gte: cutoffDate } });
      }
    }

    // 6. Experience Level Filter
    if (experienceLevel && experienceLevel !== 'all') {
      andConditions.push({
        experienceRequired: new RegExp(experienceLevel.trim(), 'i'),
      });
    }

    // Construct base query
    const baseQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    // ── Resolve the effective search query ──────────────────────────────────
    const trimmedSearch = (search || '').trim();
    let query = baseQuery;
    let useTextScore = false;
    let total = 0;

    if (trimmedSearch) {
      try {
        const textQuery =
          andConditions.length > 0
            ? { $and: [...andConditions, { $text: { $search: trimmedSearch } }] }
            : { $text: { $search: trimmedSearch } };

        total = await Job.countDocuments(textQuery);
        if (total > 0) {
          query = textQuery;
          useTextScore = true;
        }
      } catch (textErr) {
        console.warn(`[Jobs] $text unavailable, falling back to regex: ${textErr.message}`);
        total = 0;
      }

      if (!useTextScore) {
        const sanitized = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(sanitized, 'i');
        const searchOr = [
          { title: regex },
          { company: regex },
          { description: regex },
          { skills: regex },
        ];

        query =
          andConditions.length > 0
            ? { $and: [...andConditions, { $or: searchOr }] }
            : { $or: searchOr };

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

    const jobs = await Job.find(query, projection)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // Decorate with match scores if user is authenticated
    const decoratedJobs = await decorateJobs(jobs, req.user?.id);

    const responsePayload = { jobs: decoratedJobs, total, page, limit, totalPages };

    // Cache the raw (undecorated) listings for 60s
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
 * @route   POST /api/jobs/:id/explain
 * @desc    Get or generate AI Match Explanation for current candidate & job (cached in MongoDB with force-regeneration support)
 * @access  Protected
 */
const getMatchExplanation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: jobId } = req.params;
    const forceRegenerate = req.query.force === 'true' || req.body?.force === true;

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

    if (!forceRegenerate) {
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
            breakdown: matchResult.breakdown,
            aiDisclaimer: AI_DISCLOSURE,
            generatedAt: cachedExplanation.generatedAt,
            cached: true,
          },
        });
      }
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
        breakdown: matchResult.breakdown,
        aiDisclaimer: AI_DISCLOSURE,
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
    const jobHasSkills = (job.skills || []).length > 0;
    const isGenericRoadmap = !jobHasSkills;

    // Short-circuit: if the job lists skills and the candidate already matches
    // ALL of them, there are no gaps to build a roadmap around.
    if (jobHasSkills && matchResult.missingSkills.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          noGaps: true,
          jobTitle: job.title,
          jobCompany: job.company,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: [],
          totalWeeks: 0,
          weeks: [],
          overallProgress: {
            totalTasks: 0,
            completedTasks: 0,
            progressPercent: 100,
            estimatedRemainingMinutes: 0,
          },
          weeklyProgress: [],
        },
      });
    }

    const cachedRoadmap = await Roadmap.findOne({ userId, jobId }).lean();

    if (!forceRegenerate && cachedRoadmap) {
      const isCacheFresh =
        cachedRoadmap.candidateProfileVersion &&
        new Date(cachedRoadmap.candidateProfileVersion).getTime() >= new Date(profileVersion).getTime();

      if (isCacheFresh) {
        const normalizedWeeks = normalizeRoadmapWeeks(cachedRoadmap.weeks);
        const { weeklyProgress, overallProgress } = calculateRoadmapProgress(normalizedWeeks);

        return res.status(200).json({
          success: true,
          data: {
            totalWeeks: cachedRoadmap.totalWeeks,
            weeks: normalizedWeeks,
            generatedAt: cachedRoadmap.generatedAt,
            jobTitle: job.title,
            jobCompany: job.company,
            missingSkills: matchResult.missingSkills,
            isGenericRoadmap,
            cached: true,
            overallProgress,
            weeklyProgress,
          },
        });
      }
    }

    // Extract previous tasks to preserve completed states across regeneration
    const previousTasks = [];
    if (cachedRoadmap && Array.isArray(cachedRoadmap.weeks)) {
      const normalizedOld = normalizeRoadmapWeeks(cachedRoadmap.weeks);
      normalizedOld.forEach((w) => {
        (w.tasks || []).forEach((t) => previousTasks.push(t));
      });
    }

    const aiRoadmap = await generateLearningRoadmap({
      missingSkills: matchResult.missingSkills,
      job,
      candidateProfile: userProfile,
      matchedSkills: matchResult.matchedSkills,
      previousTasks,
    });

    const normalizedNewWeeks = normalizeRoadmapWeeks(aiRoadmap.weeks);

    const saved = await Roadmap.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          candidateProfileVersion: profileVersion,
          totalWeeks: aiRoadmap.totalWeeks,
          weeks: normalizedNewWeeks,
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const { weeklyProgress, overallProgress } = calculateRoadmapProgress(saved.weeks);

    return res.status(200).json({
      success: true,
      data: {
        totalWeeks: saved.totalWeeks,
        weeks: saved.weeks,
        generatedAt: saved.generatedAt,
        jobTitle: job.title,
        jobCompany: job.company,
        missingSkills: matchResult.missingSkills,
        isGenericRoadmap,
        cached: false,
        overallProgress,
        weeklyProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/jobs/:id/roadmap/tasks/:taskId
 * @desc    Toggle or update completion state of an individual roadmap task
 * @access  Protected
 */
const updateRoadmapTaskProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: jobId, taskId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Field "completed" must be an explicit boolean (true or false).',
      });
    }

    const roadmapDoc = await Roadmap.findOne({ userId, jobId });
    if (!roadmapDoc) {
      return res.status(404).json({
        success: false,
        message: 'No learning roadmap found for this job and candidate.',
      });
    }

    const normalizedWeeks = normalizeRoadmapWeeks(roadmapDoc.weeks);
    let targetTask = null;

    for (const week of normalizedWeeks) {
      for (const task of week.tasks) {
        if (task.taskId === taskId) {
          task.completed = completed;
          task.completedAt = completed ? new Date() : null;
          targetTask = task;
          break;
        }
      }
      if (targetTask) break;
    }

    if (!targetTask) {
      return res.status(404).json({
        success: false,
        message: `Task with identifier "${taskId}" not found in this roadmap.`,
      });
    }

    roadmapDoc.weeks = normalizedWeeks;
    await roadmapDoc.save();

    const { weeklyProgress, overallProgress } = calculateRoadmapProgress(normalizedWeeks);

    return res.status(200).json({
      success: true,
      message: completed ? 'Task marked complete.' : 'Task marked incomplete.',
      data: {
        task: targetTask,
        weeklyProgress,
        overallProgress,
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
  updateRoadmapTaskProgress,
};
