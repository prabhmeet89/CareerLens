const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ensure local uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

let storage;
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  try {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'careerlens_resumes',
        resource_type: 'raw',
        format: async (req, file) => 'pdf',
        public_id: (req, file) => `resume_${Date.now()}_${path.parse(file.originalname).name}`,
      },
    });

    console.log('[Storage] Cloudinary storage configured successfully.');
  } catch (err) {
    console.warn('[Storage] Cloudinary setup failed, falling back to local disk storage:', err.message);
  }
}

// Fallback to local disk storage
if (!storage) {
  /*
   * LOCAL DISK STORAGE FALLBACK:
   * Saves uploaded PDF files into the local /backend/uploads directory.
   * To swap in Cloudinary: Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
   * and CLOUDINARY_API_SECRET in backend/.env.
   */
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${uniqueSuffix}-${sanitizedName}`);
    },
  });

  console.log(`[Storage] Local disk storage initialized at: ${UPLOAD_DIR}`);
}

/**
 * Safely delete a file from local disk or Cloudinary.
 * Swallows missing file errors idempotently.
 *
 * @param {string} fileUrlOrPath - Local file path or Cloudinary URL
 */
const deleteStoredFile = async (fileUrlOrPath) => {
  if (!fileUrlOrPath) return;

  try {
    // If local file path
    if (fs.existsSync(fileUrlOrPath)) {
      await fs.promises.unlink(fileUrlOrPath);
      return;
    }

    // Check if within uploads directory by filename
    const basename = path.basename(fileUrlOrPath);
    const localUploadPath = path.join(UPLOAD_DIR, basename);
    if (fs.existsSync(localUploadPath)) {
      await fs.promises.unlink(localUploadPath);
      return;
    }

    // If Cloudinary URL and Cloudinary is configured
    if (hasCloudinary && fileUrlOrPath.includes('cloudinary.com')) {
      const cloudinary = require('cloudinary').v2;
      const match = fileUrlOrPath.match(/careerlens_resumes\/([^.]+)/);
      if (match && match[1]) {
        await cloudinary.uploader.destroy(`careerlens_resumes/${match[1]}`, { resource_type: 'raw' });
      }
    }
  } catch (err) {
    console.warn(`[Storage] Could not delete stored file (${fileUrlOrPath}):`, err.message);
  }
};

module.exports = {
  storage,
  UPLOAD_DIR,
  isCloudinary: !!hasCloudinary,
  deleteStoredFile,
};
