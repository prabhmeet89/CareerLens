const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const Resume = require('../models/Resume');
const CandidateProfile = require('../models/CandidateProfile');
const SavedJob = require('../models/SavedJob');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const MatchExplanation = require('../models/MatchExplanation');
const Roadmap = require('../models/Roadmap');
const { deleteStoredFile } = require('../config/storage');
const { invalidateRecommendations } = require('../utils/cacheKeys');
const { sendPasswordResetEmail } = require('../services/emailService');

const COOKIE_NAME = 'token';
const COOKIE_EXPIRES_DAYS = 7;

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: `${COOKIE_EXPIRES_DAYS}d`,
  });
};

// Helper to get cookie options
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Frontend & backend validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    if (!email || !validator.isEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      tagline: 'Aspiring Full Stack Developer',
    });

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(newUser._id);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: newUser.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & set cookie
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(user._id);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user & clear cookie
 * @access  Public
 */
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user
 * @access  Protected
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
};

/**
 * @route   DELETE /api/auth/account
 * @desc    Permanently delete user account and cascade purge all associated data
 * @access  Protected
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required to delete your account.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Account deletion requires valid password confirmation.',
      });
    }

    // 1. Remove physical resume files
    const resumes = await Resume.find({ userId });
    for (const r of resumes) {
      if (r.fileUrl) {
        await deleteStoredFile(r.fileUrl);
      }
    }

    // 2. Cascade delete all user documents
    await Promise.all([
      User.findByIdAndDelete(userId),
      Resume.deleteMany({ userId }),
      CandidateProfile.deleteMany({ userId }),
      SavedJob.deleteMany({ userId }),
      Application.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      MatchExplanation.deleteMany({ userId }),
      Roadmap.deleteMany({ userId }),
    ]);

    // 3. Invalidate Redis recommendation cache
    await invalidateRecommendations(userId);

    // 4. Invalidate session cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a password reset link (non-revealing for anti-enumeration)
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return generic success message to prevent user enumeration attacks
    const genericSuccessMessage =
      'If an account exists with that email, a password reset link has been sent.';

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage,
      });
    }

    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token hash + expiry on user
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Construct client reset URL using configured CLIENT_URL
    const clientBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
    const resetUrl = `${clientBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    // Dispatch email asynchronously
    await sendPasswordResetEmail({
      toEmail: user.email,
      recipientName: user.name,
      resetUrl,
      expiresInMinutes: 60,
    });

    return res.status(200).json({
      success: true,
      message: genericSuccessMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using secure token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, token, and new password are required.',
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

    // Query user with matching email, active unexpired token hash
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // Invalidate/clear reset token fields
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  deleteAccount,
  forgotPassword,
  resetPassword,
};

