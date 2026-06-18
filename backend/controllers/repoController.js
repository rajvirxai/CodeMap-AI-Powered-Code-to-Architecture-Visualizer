/**
 * Repository Controller
 * 
 * This file handles the business logic for all repository-related API endpoints.
 * It contains the handler functions for:
 * 1. Health check (GET /health)
 * 2. Uploading a ZIP (POST /upload)
 * 3. Scanning and analyzing the extracted folder (POST /analyze)
 * 4. Cloning a repository from a Git URL (POST /clone)
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { scanDirectory } = require('../utils/repoScanner');
const { analyzeArchitecture } = require('../utils/geminiAnalyzer');
const { mongoose, Analysis } = require('../utils/db');

/**
 * 1. Health Check Endpoint
 * Simply verifies that the server is up and responding.
 */
const getHealth = (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Server is healthy'
  });
};

/**
 * 2. Upload Repo Endpoint
 * Receives the ZIP file via Multer, extracts it using adm-zip,
 * and returns a folderId to the client for subsequent analysis.
 */
const uploadRepo = (req, res) => {
  try {
    // Check if multer successfully captured a file
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a ZIP file.' });
    }

    // Ensure the file is indeed a ZIP
    if (path.extname(req.file.originalname).toLowerCase() !== '.zip') {
      return res.status(400).json({ error: 'Invalid file format. Only ZIP files are supported.' });
    }

    // Generate a unique folder name using the current timestamp and clean original filename
    const cleanName = path.basename(req.file.originalname, '.zip').replace(/[^a-zA-Z0-9-_]/g, '');
    const folderId = `${Date.now()}-${cleanName}`;
    
    // Resolve paths
    const zipFilePath = req.file.path;
    const extractPath = path.join(__dirname, '../uploads/extracted', folderId);

    // Initialize AdmZip to extract the uploaded file
    const zip = new AdmZip(zipFilePath);
    
    // Extract all contents to target path.
    // The second parameter 'true' forces overwrite if files exist.
    zip.extractAllTo(extractPath, true);

    // Respond back with the unique folder ID that frontend can use to request analysis
    return res.status(200).json({
      message: 'File uploaded and extracted successfully',
      folderId: folderId
    });
  } catch (error) {
    console.error('Error during file upload or extraction:', error);
    return res.status(500).json({
      error: 'Failed to process the uploaded ZIP file',
      details: error.message
    });
  }
};

/**
 * 3. Analyze Repo Endpoint
 * Scans the directory corresponding to folderId using our repoScanner utility
 * and returns the directory structure JSON tree.
 */
const analyzeRepo = async (req, res) => {
  try {
    const { folderId } = req.body;

    // Validate that folderId was provided in the request
    if (!folderId) {
      return res.status(400).json({ error: 'Missing folderId in request body.' });
    }

    // Build the expected folder path
    const folderPath = path.join(__dirname, '../uploads/extracted', folderId);

    // Verify that the folder actually exists
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: 'Folder not found. It may have been deleted or the upload expired.' });
    }

    // Scan the folder recursively and get the JSON tree structure
    // We pass 'project' (or the original project folder name) as the root node name
    const folderDisplayName = folderId.substring(folderId.indexOf('-') + 1) || 'project';
    const repoTree = scanDirectory(folderPath, folderDisplayName);

    // Analyze the repository structure using Gemini API
    const architecture = await analyzeArchitecture(repoTree);

    // Save the analysis to the MongoDB database if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Analysis.findOneAndUpdate(
          { folderId },
          { repoTree, architecture },
          { upsert: true, new: true }
        );
        console.log(`💾 Saved analysis successfully for: ${folderId}`);
      } catch (dbErr) {
        console.error('⚠️ Database save error:', dbErr.message);
      }
    } else {
      console.warn('⚠️ MongoDB not connected. Skipping database write.');
    }

    // Return the scanned tree and architecture analysis
    // Uses fileTree key to match the frontend expectations
    return res.status(200).json({
      fileTree: repoTree,
      architecture: architecture
    });
  } catch (error) {
    console.error('Error during repository analysis:', error);
    return res.status(500).json({
      error: 'Failed to analyze the repository structure',
      details: error.message
    });
  }
};

/**
 * 4. Clone Repo Endpoint
 * Clones a Git repository from a URL into the uploads folder.
 */
const cloneRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Missing repoUrl in request body.' });
    }

    // Extract a clean name from the repo URL
    let repoName = 'cloned-repo';
    try {
      const parsedUrl = new URL(repoUrl);
      const pathname = parsedUrl.pathname;
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        repoName = parts[parts.length - 1].replace(/\.git$/, '');
      }
    } catch (e) {
      // Use fallback name
    }

    const cleanName = repoName.replace(/[^a-zA-Z0-9-_]/g, '');
    const folderId = `clone-${Date.now()}-${cleanName}`;
    const extractPath = path.join(__dirname, '../uploads/extracted', folderId);

    // Run git clone command with depth 1
    console.log(`Cloning repository ${repoUrl} to ${extractPath}...`);
    await execPromise(`git clone --depth 1 "${repoUrl}" "${extractPath}"`);

    return res.status(200).json({
      message: 'Repository cloned successfully',
      folderId: folderId
    });
  } catch (error) {
    console.error('Error during repository cloning:', error);
    return res.status(500).json({
      error: 'Failed to clone the git repository',
      details: error.message
    });
  }
};

module.exports = {
  getHealth,
  uploadRepo,
  analyzeRepo,
  cloneRepo
};
