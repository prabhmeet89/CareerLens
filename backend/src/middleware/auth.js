const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Read JWT from HTTP-only cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[AuthMiddleware] JWT_SECRET is missing in environment variables.');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. Please log in again.',
      });
    }

    // Verify user exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.',
    });
  }
};

module.exports = authMiddleware;
