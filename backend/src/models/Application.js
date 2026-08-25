'use strict';
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 2000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications to the same job by the same user
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Compound indexes for user sorting and status filtering
applicationSchema.index({ userId: 1, appliedAt: -1 });
applicationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
