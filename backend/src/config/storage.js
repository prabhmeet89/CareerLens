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

module.exports = {
  storage,
  UPLOAD_DIR,
  isCloudinary: !!hasCloudinary,
};
