import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateContent, analyzeRepository, explainCodeFile, generateReadmeFromTree } from './backend/services/llmService.js';


dotenv.config();
if (!process.env.GEMINI_API_KEY) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, './.env') });
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Gemini AI API Server is running.');
});

// API endpoint to generate content
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  const provider = req.body.provider || req.query.provider || req.headers['x-provider'] || 'gemini';
  const model = req.body.model || req.query.model || req.headers['x-model'];

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required in the request body.' });
  }

  try {
    const text = await generateContent({ prompt, provider, model });

    console.log(`[${provider.toUpperCase()}] Response:`, text);
    res.json({
      success: true,
      response: text
    });
  } catch (error) {
    console.error(`Error generating content via ${provider}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to analyze repository structure
app.post('/api/analyze', async (req, res) => {
  const { repositoryStructure } = req.body;
  const provider = req.body.provider || req.query.provider || req.headers['x-provider'] || 'gemini';
  const model = req.body.model || req.query.model || req.headers['x-model'];

  if (!repositoryStructure) {
    return res.status(400).json({ error: 'repositoryStructure is required in the request body.' });
  }

  try {
    const parsed = await analyzeRepository({ repositoryStructure, provider, model });
    res.json(parsed);
  } catch (error) {
    console.error(`Error analyzing repository via ${provider}:`, error);
    res.status(500).json({
      error: "Invalid AI response"
    });
  }
});

// API endpoint to explain a code file
app.post('/api/explain', async (req, res) => {
  const { fileName, fileContent } = req.body;
  const provider = req.body.provider || req.query.provider || req.headers['x-provider'] || 'gemini';
  const model = req.body.model || req.query.model || req.headers['x-model'];

  if (!fileName || !fileContent) {
    return res.status(400).json({ error: 'fileName and fileContent are required in the request body.' });
  }

  try {
    const explanation = await explainCodeFile({ fileName, fileContent, provider, model });
    res.json(explanation);
  } catch (error) {
    console.error(`Error explaining file via ${provider}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to generate README.md
app.post('/api/generate-readme', async (req, res) => {
  const { projectName, fileTree } = req.body;
  const provider = req.body.provider || req.query.provider || req.headers['x-provider'] || 'gemini';
  const model = req.body.model || req.query.model || req.headers['x-model'];

  if (!projectName || !fileTree) {
    return res.status(400).json({ error: 'projectName and fileTree are required in the request body.' });
  }

  try {
    const readme = await generateReadmeFromTree({ projectName, fileTree, provider, model });
    res.json({ readme });
  } catch (error) {
    console.error(`Error generating README via ${provider}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
