'use strict';

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['documentation', 'tutorial', 'guide', 'practice', 'course', 'other'],
      default: 'documentation',
    },
    domain: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const roadmapTaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 480,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

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
      maxlength: 300,
    },
    tasks: {
      type: [roadmapTaskSchema],
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

/**
 * Normalizes legacy roadmap documents where tasks might be an array of strings
 * into the structured task schema with stable deterministic IDs.
 */
function normalizeRoadmapWeeks(weeks = []) {
  if (!Array.isArray(weeks)) return [];

  return weeks.map((w, wIdx) => {
    const weekNum = Number(w.week) || wIdx + 1;
    const focus = String(w.focus || `Week ${weekNum} Focus`).trim();
    const tasks = (w.tasks || []).map((t, tIdx) => {
      // Legacy string format
      if (typeof t === 'string') {
        return {
          taskId: `w${weekNum}_t${tIdx}`,
          title: t.trim(),
          description: '',
          estimatedMinutes: 60,
          resources: [],
          completed: false,
          completedAt: null,
        };
      }

      // Structured format
      return {
        taskId: String(t.taskId || `w${weekNum}_t${tIdx}`).trim(),
        title: String(t.title || 'Practical skill development objective').trim(),
        description: String(t.description || '').trim(),
        estimatedMinutes: Number(t.estimatedMinutes) || 60,
        resources: Array.isArray(t.resources) ? t.resources : [],
        completed: Boolean(t.completed),
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      };
    });

    return {
      week: weekNum,
      focus,
      tasks,
    };
  });
}

/**
 * Computes canonical weekly and overall progress from normalized weeks.
 */
function calculateRoadmapProgress(weeks = []) {
  let totalTasks = 0;
  let completedTasks = 0;
  let estimatedRemainingMinutes = 0;

  const weeklyProgress = weeks.map((w) => {
    const wTotal = w.tasks.length;
    const wCompleted = w.tasks.filter((t) => t.completed).length;
    const wProgressPercent = wTotal > 0 ? Math.round((wCompleted / wTotal) * 100) : 0;

    totalTasks += wTotal;
    completedTasks += wCompleted;

    w.tasks.forEach((t) => {
      if (!t.completed) {
        estimatedRemainingMinutes += Number(t.estimatedMinutes) || 60;
      }
    });

    return {
      week: w.week,
      totalTasks: wTotal,
      completedTasks: wCompleted,
      progressPercent: wProgressPercent,
    };
  });

  const overallProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    weeklyProgress,
    overallProgress: {
      totalTasks,
      completedTasks,
      progressPercent: overallProgressPercent,
      estimatedRemainingMinutes,
    },
  };
}

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
module.exports.normalizeRoadmapWeeks = normalizeRoadmapWeeks;
module.exports.calculateRoadmapProgress = calculateRoadmapProgress;
