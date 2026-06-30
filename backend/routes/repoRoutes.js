/**
 * Repository Routes
 * 
 * This file defines the routes (API endpoints) for our backend server.
 * It maps requests to specific paths to their respective controller functions.
 * It also configures and uses Multer middleware for handling multipart file uploads.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { getHealth, uploadRepo, analyzeRepo, cloneRepo, explainFile, generateReadme } = require('../controllers/repoController');

// Define where multer will save uploaded files (uploads/ directory in root)
const uploadDir = path.join(__dirname, '../uploads');

// Ensure that the uploads directory exists on server startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure Multer disk storage.
 * This determines where files are saved and how they are named.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files in the uploads folder
  },
  filename: (req, file, cb) => {
    // Prefix filenames with current timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Initialize Multer upload middleware with improved validation
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size to prevent abuse
  },
  fileFilter: (req, file, cb) => {
    // Only accept .zip files by checking both extension and mimetype
    const ext = path.extname(file.originalname).toLowerCase();
    const isZipMimeType = file.mimetype === 'application/zip' || 
                          file.mimetype === 'application/x-zip-compressed' || 
                          file.mimetype === 'multipart/x-zip';
                          
    if (ext !== '.zip' || !isZipMimeType) {
      const error = new Error('Only valid ZIP files are allowed');
      error.status = 400; // Set explicit status code
      return cb(error, false);
    }
    cb(null, true);
  }
});

/**
 * Endpoint 1: Health check
 * Method: GET
 * Path: /health
 */
router.get('/health', getHealth);

/**
 * Endpoint 2: Upload file
 * Method: POST
 * Path: /upload
 * Middleware: upload.single('file') expects form-data with key named 'file'
 */
router.post('/upload', upload.single('file'), uploadRepo);

/**
 * Endpoint 3: Analyze repository folder
 * Method: POST
 * Path: /analyze
 */
router.post('/analyze', analyzeRepo);

/**
 * Endpoint 4: Clone repository
 * Method: POST
 * Path: /clone
 */
router.post('/clone', cloneRepo);

/**
 * Endpoint 5: Explain file content
 * Method: POST
 * Path: /explain
 */
router.post('/explain', explainFile);

/**
 * Endpoint 6: Generate README.md automatically
 * Method: POST
 * Path: /generate-readme
 */
router.post('/generate-readme', generateReadme);

module.exports = router;
