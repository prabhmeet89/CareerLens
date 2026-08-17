const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    filePath: {
      type: String, // Path on local disk if stored locally
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileSize: {
      type: Number, // In bytes
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
