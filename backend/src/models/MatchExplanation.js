const mongoose = require('mongoose');

const matchExplanationSchema = new mongoose.Schema(
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
      index: true,
    },
    candidateProfileVersion: {
      type: Date,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    gaps: {
      type: [String],
      default: [],
    },
    verdict: {
      type: String,
      default: 'Good Potential Fit',
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so each user+job explanation is cached uniquely
matchExplanationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const MatchExplanation = mongoose.model('MatchExplanation', matchExplanationSchema);

module.exports = MatchExplanation;
