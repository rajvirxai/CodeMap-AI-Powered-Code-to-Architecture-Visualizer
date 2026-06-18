/**
 * Server Entry Point - index.js
 * 
 * This is the main server file that initializes and starts the Express application.
 * It configures basic middleware, mounts routes, implements standard error handling,
 * and starts the HTTP server listening on a defined port.
 */

const express = require('express');
const cors = require('cors');
const repoRoutes = require('./routes/repoRoutes');

// Initialize the Express application
const app = express();

// Set the port to environment variable PORT or default to 5000
const PORT = process.env.PORT || 5000;

/**
 * Configure standard Middlewares:
 * 1. CORS: Enable Cross-Origin Resource Sharing so our frontend (which might run on another port)
 *    can make API requests to this backend.
 * 2. express.json(): Automatically parse incoming requests with JSON payloads (e.g., req.body in POST /analyze).
 * 3. express.urlencoded(): Parse incoming URL-encoded form data payloads.
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Mount the repository routes directly on the root path ('/').
 * This exposes endpoints like GET /health, POST /upload, and POST /analyze.
 */
app.use('/', repoRoutes);

/**
 * Global Error Handling Middleware
 * Captures any unhandled errors in route handlers or middleware (e.g., Multer file type rejection).
 */
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  
  // Custom check if error was thrown by Multer
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message.includes('Only ZIP files')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening for incoming HTTP requests on the specified port if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`🚀 Server is successfully running on http://localhost:${PORT}`);
    console.log(`📌 Health check: GET http://localhost:${PORT}/health`);
    console.log(`========================================================`);
  });
}

module.exports = app;

