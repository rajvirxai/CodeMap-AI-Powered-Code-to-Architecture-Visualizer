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
const { analyzeArchitecture, explainCodeFile, generateReadmeFromTree } = require('../utils/geminiAnalyzer');
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
    console.log(`[API POST /upload] Started processing upload request.`);
    // Check if multer successfully captured a file
    if (!req.file) {
      console.warn(`[API Warning] Upload failed: No file provided in request.`);
      return res.status(400).json({ error: 'No file uploaded. Please upload a ZIP file.' });
    }

    // Ensure the file is indeed a ZIP
    if (path.extname(req.file.originalname).toLowerCase() !== '.zip') {
      console.warn(`[API Warning] Upload failed: Invalid file format (${req.file.originalname}).`);
      return res.status(400).json({ error: 'Invalid file format. Only ZIP files are supported.' });
    }

    // Generate a unique folder name using the current timestamp and clean original filename
    const cleanName = path.basename(req.file.originalname, '.zip').replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 15);
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
    console.log(`[API Success] File uploaded and extracted successfully. Folder ID: ${folderId}`);
    return res.status(200).json({
      message: 'File uploaded and extracted successfully',
      folderId: folderId
    });
  } catch (error) {
    console.error('[API Error /upload] Error during file upload or extraction:', error);
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
    console.log(`[API POST /analyze] Started analyzing repo.`);
    const { folderId } = req.body;

    // Validate that folderId was provided in the request and is a string
    if (!folderId || typeof folderId !== 'string') {
      console.warn(`[API Warning] Analyze failed: Missing or invalid folderId.`);
      return res.status(400).json({ error: 'Missing or invalid folderId in request body.' });
    }

    // Build the expected folder path
    const folderPath = path.join(__dirname, '../uploads/extracted', folderId);

    // Verify that the folder actually exists
    if (!fs.existsSync(folderPath)) {
      console.warn(`[API Warning] Analyze failed: Folder not found for ID ${folderId}.`);
      return res.status(404).json({ error: 'Folder not found. It may have been deleted or the upload expired.' });
    }

    // Scan the folder recursively and get the JSON tree structure
    console.log(`[API Info] Scanning directory for folderId: ${folderId}`);
    // We pass 'project' (or the original project folder name) as the root node name
    const folderDisplayName = folderId.substring(folderId.indexOf('-') + 1) || 'project';
    const repoTree = scanDirectory(folderPath, folderDisplayName);
    console.log(`[API Info] Scan complete. Beginning architecture analysis...`);

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
    console.log(`[API Success] Repository analysis completed successfully for: ${folderId}`);
    return res.status(200).json({
      fileTree: repoTree,
      architecture: architecture
    });
  } catch (error) {
    console.error('[API Error /analyze] Error during repository analysis:', error);
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
    console.log(`[API POST /clone] Started cloning repository.`);
    const { repoUrl } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      console.warn(`[API Warning] Clone failed: Missing or invalid repoUrl.`);
      return res.status(400).json({ error: 'Missing or invalid repoUrl in request body.' });
    }

    // Sanitize GitHub browser URLs to extract the base clone URL.
    // Users often paste URLs like:
    //   https://github.com/user/repo/tree/main
    //   https://github.com/user/repo/blob/main/file.js
    //   https://github.com/user/repo/issues
    // Git clone only accepts: https://github.com/user/repo
    let cleanRepoUrl = repoUrl.trim();
    try {
      const parsedUrl = new URL(cleanRepoUrl);
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      // GitHub repo path is always /owner/repo — everything after is browser navigation
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, '');
        cleanRepoUrl = `${parsedUrl.protocol}//${parsedUrl.host}/${owner}/${repo}`;
      }
    } catch (e) {
      // If URL parsing fails, use original URL as-is
    }

    // Extract a clean name from the sanitized URL
    let repoName = 'cloned-repo';
    try {
      const parsedUrl = new URL(cleanRepoUrl);
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        repoName = parts[1].replace(/\.git$/, '');
      }
    } catch (e) {
      // Use fallback name
    }

    const cleanName = repoName.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 15);
    const folderId = `clone-${Date.now()}-${cleanName}`;
    const extractPath = path.join(__dirname, '../uploads/extracted', folderId);

    // Run git clone command with depth 1 using the sanitized URL
    console.log(`[API Info] Cloning repository ${cleanRepoUrl} to ${extractPath}...`);
    await execPromise(`git clone --depth 1 "${cleanRepoUrl}" "${extractPath}"`);

    console.log(`[API Success] Repository cloned successfully to folderId: ${folderId}`);
    return res.status(200).json({
      message: 'Repository cloned successfully',
      folderId: folderId
    });
  } catch (error) {
    console.error('[API Error /clone] Error during repository cloning:', error);
    return res.status(500).json({
      error: 'Failed to clone the git repository',
      details: error.message
    });
  }
};

/**
 * 5. Explain Code File Endpoint
 * Reads the file content from uploads/extracted/<folderId>/<filePath> and uses Gemini to explain it.
 */
const explainFile = async (req, res) => {
  try {
    console.log(`[API POST /explain] Started explaining file.`);
    const { folderId, filePath } = req.body;

    if (!folderId || typeof folderId !== 'string' || !filePath || typeof filePath !== 'string') {
      console.warn(`[API Warning] Explain failed: Missing or invalid folderId or filePath.`);
      return res.status(400).json({ error: 'Missing or invalid folderId or filePath in request body.' });
    }

    // Sanitize the path to prevent directory traversal
    const safeFilePath = path.normalize(filePath).replace(/^(\.\.(\/|\\))+/, '');
    const absolutePath = path.join(__dirname, '../uploads/extracted', folderId, safeFilePath);

    // Ensure the resolved path resides within the target extraction directory
    const expectedBase = path.join(__dirname, '../uploads/extracted', folderId);
    if (!absolutePath.startsWith(expectedBase)) {
      console.warn(`[API Warning] Explain failed: Access denied (Path traversal detected) for ${filePath}.`);
      return res.status(403).json({ error: 'Access denied: Path traversal detected.' });
    }

    // Verify file existence
    if (!fs.existsSync(absolutePath)) {
      console.warn(`[API Warning] Explain failed: File not found - ${absolutePath}`);
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      return res.status(200).json({
        purpose: `This is a directory folder named '${path.basename(filePath)}' containing related modules and resource files.`,
        inputs: ['Internal child modules and files'],
        outputs: ['Exported methods and interfaces inside its children'],
        dependencies: [],
        role: 'Folder / Namespace Container'
      });
    }

    // Limit maximum file size to read (e.g. 50KB) to prevent token overflow
    const maxSizeBytes = 50 * 1024;
    if (stats.size > maxSizeBytes) {
      return res.status(200).json({
        purpose: `Large module file containing system resources and bundle declarations.`,
        inputs: ['Various package and asset imports'],
        outputs: ['System configurations and runtime setups'],
        dependencies: [],
        role: 'Large System File'
      });
    }

    // Read file contents
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const fileName = path.basename(filePath);

    // Call Gemini/Groq analyzer
    console.log(`[API Info] Calling analyzer for file: ${fileName}`);
    const explanation = await explainCodeFile(fileName, fileContent);
    
    console.log(`[API Success] File explanation generated successfully for: ${fileName}`);
    return res.status(200).json(explanation);

  } catch (error) {
    console.error('[API Error /explain] Error in explainFile controller:', error);
    return res.status(500).json({
      error: 'Failed to explain the code file',
      details: error.message
    });
  }
};

/**
 * 6. Generate README Endpoint
 * Generates a README.md file content based on the project folder structure.
 */
const generateReadme = async (req, res) => {
  try {
    console.log(`[API POST /generate-readme] Started generating README.`);
    const { folderId } = req.body;

    if (!folderId || typeof folderId !== 'string') {
      console.warn(`[API Warning] Generate README failed: Missing or invalid folderId.`);
      return res.status(400).json({ error: 'Missing or invalid folderId in request body.' });
    }

    // Resolve target project path
    const folderPath = path.join(__dirname, '../uploads/extracted', folderId);

    if (!fs.existsSync(folderPath)) {
      console.warn(`[API Warning] Generate README failed: Folder not found - ${folderId}`);
      return res.status(404).json({ error: 'Folder not found. It may have expired or was deleted.' });
    }

    console.log(`[API Info] Scanning directory for README generation...`);
    // Scan the directory to get tree
    const folderDisplayName = folderId.substring(folderId.indexOf('-') + 1) || 'project';
    const repoTree = scanDirectory(folderPath, folderDisplayName);

    // Generate README content
    const readmeContent = await generateReadmeFromTree(folderDisplayName, repoTree);

    console.log(`[API Success] README generated successfully for: ${folderId}`);
    return res.status(200).json({
      readme: readmeContent
    });

  } catch (error) {
    console.error('[API Error /generate-readme] Error in generateReadme controller:', error);
    return res.status(500).json({
      error: 'Failed to generate README.md content',
      details: error.message
    });
  }
};

module.exports = {
  getHealth,
  uploadRepo,
  analyzeRepo,
  cloneRepo,
  explainFile,
  generateReadme
};
