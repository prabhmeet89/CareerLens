const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
      default: 'Remote',
    },
    employmentType: {
      type: String,
      enum: ['internship', 'full-time', 'part-time', 'contract'],
      required: [true, 'Employment type is required'],
      default: 'full-time',
      index: true,
    },
    experienceRequired: {
      type: String,
      default: '0-1 years',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    salary: {
      type: String,
      default: '$80,000 - $110,000 / yr',
      trim: true,
    },
    applicationUrl: {
      type: String,
      default: 'https://careers.example.com',
      trim: true,
    },
    source: {
      type: String,
      default: 'seed',
      index: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search across title, company, description, and skills
jobSchema.index(
  { title: 'text', company: 'text', description: 'text', skills: 'text' },
  { weights: { title: 10, company: 5, skills: 8, description: 1 }, name: 'job_text_search' }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
