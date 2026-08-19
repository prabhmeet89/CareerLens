'use strict';
const fs = require('fs');
const multer = require('multer');
const { storage } = require('../config/storage');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// File filter: validate PDF MIME type before accepting the file
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
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter,
}).single('resume');

/**
 * Verify PDF magic bytes (%PDF signature at the start of the file).
 * Protects against content-type spoofing where a non-PDF is renamed to .pdf.
 */
async function verifyPdfMagicBytes(filePath) {
  const PDF_MAGIC = Buffer.from('%PDF');
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { start: 0, end: 3 });
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      const header = Buffer.concat(chunks);
      resolve(header.slice(0, 4).equals(PDF_MAGIC));
    });
    stream.on('error', () => resolve(false));
  });
}

// Wrapper middleware: Multer upload + magic-byte validation
const uploadMiddleware = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'File is too large. Maximum allowed resume size is 5MB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ success: false, message: "Unexpected field name. Please upload with field name 'resume'." });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Error uploading file.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No resume file uploaded. Please select a PDF file under the 'resume' field." });
    }

    // Magic-byte check for disk-stored files (skipped for memory/Cloudinary buffers)
    if (req.file.path) {
      try {
        const isValidPdf = await verifyPdfMagicBytes(req.file.path);
        if (!isValidPdf) {
          // Delete the spoofed file immediately
          fs.unlink(req.file.path, () => {});
          return res.status(400).json({
            success: false,
            message: 'Uploaded file does not appear to be a valid PDF. Please upload a genuine PDF document.',
          });
        }
      } catch {
        // If magic-byte check fails for any reason, proceed (non-blocking security enhancement)
      }
    }

    next();
  });
};

module.exports = uploadMiddleware;
