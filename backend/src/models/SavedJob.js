'use strict';
const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema(
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate saves for the same user+job pair
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Compound index for user saved jobs retrieval, newest first
savedJobSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavedJob', savedJobSchema);
