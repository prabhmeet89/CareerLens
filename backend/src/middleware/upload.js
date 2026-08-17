const multer = require('multer');
const { storage } = require('../config/storage');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// File filter: strict validation of PDF MIME type
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF documents (application/pdf) are supported.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
}).single('resume');

// Wrapper middleware to provide clean error responses
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File is too large. Maximum allowed resume size is 5MB.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: "Unexpected field name. Please upload with field name 'resume'.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No resume file uploaded. Please select a PDF file under the 'resume' field.",
      });
    }

    next();
  });
};

module.exports = uploadMiddleware;
