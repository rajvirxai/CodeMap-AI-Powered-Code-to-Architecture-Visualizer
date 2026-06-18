/**
 * Repository Controller
 * 
 * This file handles the business logic for all repository-related API endpoints.
 * It contains the handler functions for:
 * 1. Health check (GET /health)
 * 2. Uploading a ZIP (POST /upload)
 * 3. Scanning and analyzing the extracted folder (POST /analyze)
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { scanDirectory } = require('../utils/repoScanner');
const { analyzeRepository } = require('../services/llmService');
const db = require('../utils/db');

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
    const provider = req.body.provider || req.query.provider || req.headers['x-provider'] || 'gemini';
    const model = req.body.model || req.query.model || req.headers['x-model'];

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

    // Analyze the repository tree using the AI service
    const architecture = await analyzeRepository({ repositoryStructure: repoTree, provider, model });

    // Save the analysis to the database
    db.run(
      `INSERT OR REPLACE INTO analyses (folderId, repoTree, architecture) VALUES (?, ?, ?)`,
      [folderId, JSON.stringify(repoTree), JSON.stringify(architecture)],
      (err) => {
        if (err) {
          console.error('⚠️ Database save error:', err.message);
        } else {
          console.log(`💾 Saved analysis successfully for: ${folderId}`);
        }
      }
    );

    // Return both the scanned tree and the AI-generated architecture graph
    return res.status(200).json({
      repoTree: repoTree,
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
 * 4. Get Saved Architecture Endpoint
 * Retrieves the stored analysis matching folderId from SQLite.
 */
const getArchitecture = (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    return res.status(400).json({ error: 'Missing folderId parameter.' });
  }

  db.get(`SELECT repoTree, architecture FROM analyses WHERE folderId = ?`, [folderId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Architecture map not found in database.' });
    }

    try {
      return res.status(200).json({
        repoTree: JSON.parse(row.repoTree),
        architecture: JSON.parse(row.architecture)
      });
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse database records.' });
    }
  });
};
/**
 * 5. Stream Analysis Endpoint
 * Streams real-time progress events using Server-Sent Events (SSE).
 */
const analyzeRepoStream = async (req, res) => {
  const { folderId } = req.query;
  const provider = req.query.provider || 'gemini';
  const model = req.query.model;

  // Set headers for Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*' // Support CORS for EventSource
  });

  const sendEvent = (log, progress, status = 'processing', data = null) => {
    res.write(`data: ${JSON.stringify({ log, progress, status, data })}\n\n`);
  };

  try {
    if (!folderId) {
      sendEvent('Error: Missing folderId parameter.', 0, 'error');
      return res.end();
    }

    const folderPath = path.join(__dirname, '../uploads/extracted', folderId);
    if (!fs.existsSync(folderPath)) {
      sendEvent('Error: Uploaded folder not found.', 0, 'error');
      return res.end();
    }

    // Step 1: Scanning Folder Structure
    sendEvent('• Reading file tree...', 25);
    const folderDisplayName = folderId.substring(folderId.indexOf('-') + 1) || 'project';
    const repoTree = scanDirectory(folderPath, folderDisplayName);

    // Step 2: Running LLM Dependency Analysis
    sendEvent('• Parsing code dependencies...', 50);
    const architecture = await analyzeRepository({ repositoryStructure: repoTree, provider, model });

    // Step 3: Mapping & Storing in DB
    sendEvent('• Mapping architecture nodes...', 75);
    db.run(
      `INSERT OR REPLACE INTO analyses (folderId, repoTree, architecture) VALUES (?, ?, ?)`,
      [folderId, JSON.stringify(repoTree), JSON.stringify(architecture)],
      (err) => {
        if (err) {
          console.error('⚠️ Database save error inside stream:', err.message);
        }
      }
    );

    // Step 4: Complete
    sendEvent('✓ Complete! Launching dashboard...', 100, 'complete', { repoTree, architecture });
    res.end();
  } catch (error) {
    console.error('Error during streaming analysis:', error);
    sendEvent(`Error: ${error.message}`, 0, 'error');
    res.end();
  }
};

module.exports = {
  getHealth,
  uploadRepo,
  analyzeRepo,
  getArchitecture,
  analyzeRepoStream
};
