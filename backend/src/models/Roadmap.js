const mongoose = require('mongoose');

const roadmapWeekSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
    },
    focus: {
      type: String,
      required: true,
      trim: true,
    },
    tasks: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
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
    totalWeeks: {
      type: Number,
      required: true,
      default: 4,
    },
    weeks: {
      type: [roadmapWeekSchema],
      default: [],
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

// Compound unique index so each user+job roadmap is cached uniquely
roadmapSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
