const CandidateProfile = require('../models/CandidateProfile');

/**
 * @route   GET /api/profile/me
 * @desc    Get currently authenticated user's CandidateProfile
 * @access  Protected
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await CandidateProfile.findOne({ userId })
      .populate({
        path: 'resumeId',
        select: 'originalFileName fileUrl fileSize status uploadedAt',
      })
      .lean();

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No candidate profile found. Please upload a resume to generate your profile.',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
};
