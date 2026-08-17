const mongoose = require('mongoose');

const educationItemSchema = new mongoose.Schema(
  {
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    institution: { type: String, default: '' },
  },
  { _id: false }
);

const projectItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const experienceItemSchema = new mongoose.Schema(
  {
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: [educationItemSchema],
      default: [],
    },
    projects: {
      type: [projectItemSchema],
      default: [],
    },
    experience: {
      type: [experienceItemSchema],
      default: [],
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

module.exports = CandidateProfile;
