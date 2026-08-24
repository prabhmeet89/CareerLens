'use strict';
const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { invalidateRecommendations } = require('../utils/cacheKeys');

/**
 * @route   POST /api/applications
 * @desc    Create a new application (prevents duplicates)
 * @access  Protected
 */
const createApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId, notes } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    const job = await Job.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' });
    }

    // Check for duplicate
    const existing = await Application.findOne({ userId, jobId });
    if (existing) {
      return res.status(409).json({
        success: false,
        alreadyApplied: true,
        message: `You already applied to "${job.title}" at ${job.company} on ${new Date(existing.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
        data: {
          id: existing._id.toString(),
          status: existing.status,
          appliedAt: existing.appliedAt,
          notes: existing.notes,
        },
      });
    }

    const application = await Application.create({
      userId,
      jobId,
      status: 'Applied',
      appliedAt: new Date(),
      notes: typeof notes === 'string' ? notes.trim() : '',
    });

    // Cached recommendations embed alreadyApplied — refresh them.
    await invalidateRecommendations(userId);

    return res.status(201).json({
      success: true,
      message: `Application to "${job.title}" at ${job.company} tracked!`,
      data: {
        ...application.toObject(),
        id: application._id.toString(),
        job: { title: job.title, company: job.company, location: job.location, applicationUrl: job.applicationUrl },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/applications
 * @desc    Get paginated list of applications for the authenticated user
 * @access  Protected
 */
const getApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sort === 'status' ? 'status' : 'appliedAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const total = await Application.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    const applications = await Application.find({ userId })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('jobId', 'title company location employmentType applicationUrl salary')
      .lean();

    // Build stats summary
    const allApps = await Application.find({ userId }).lean();
    const stats = {
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };
    allApps.forEach((app) => {
      if (stats[app.status] !== undefined) stats[app.status]++;
    });

    const formatted = applications.map((app) => ({
      ...app,
      id: app._id.toString(),
      job: app.jobId
        ? { ...app.jobId, id: app.jobId._id.toString() }
        : { title: 'Unknown Job', company: 'Unknown Company' },
    }));

    return res.status(200).json({
      success: true,
      data: { applications: formatted, stats, total, page, limit, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/applications/:id
 * @desc    Update application status and/or notes (self-service)
 * @access  Protected
 */
const updateApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await Application.findOne({ _id: id, userId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or you do not have permission to update it.',
      });
    }

    const oldStatus = application.status;
    if (status) application.status = status;
    if (notes !== undefined) application.notes = notes;
    await application.save();

    // Emit a notification if status actually changed
    if (status && status !== oldStatus) {
      try {
        const job = await Job.findById(application.jobId).lean();
        const jobTitle = job?.title || 'your application';
        const io = req.app.get('io');

        const notif = await Notification.create({
          userId,
          type: 'status_update',
          title: 'Application Status Updated',
          message: `Your application for "${jobTitle}" has been updated to: ${status}.`,
          jobId: application.jobId,
          read: false,
        });

        if (io) {
          io.to(userId.toString()).emit('notification:new', {
            id: notif._id.toString(),
            type: notif.type,
            title: notif.title,
            message: notif.message,
            jobId: notif.jobId,
            read: false,
            createdAt: notif.createdAt,
          });
        }
      } catch (notifErr) {
        // Non-critical — don't fail the request if notification emission fails
        console.warn('[Notifications] Failed to emit status_update notification:', notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Application updated.',
      data: { ...application.toObject(), id: application._id.toString() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createApplication, getApplications, updateApplication };
