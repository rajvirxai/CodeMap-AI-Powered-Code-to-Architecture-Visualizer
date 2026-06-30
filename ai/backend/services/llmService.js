import { ai, MODEL_NAME as GEMINI_DEFAULT_MODEL, analyzeRepository as analyzeGemini, explainCodeFile as explainGemini, generateReadmeFromTree as readmeGemini } from './geminiService.js';
import { DEFAULT_MODEL as GROQ_DEFAULT_MODEL, generateContent as generateGroq, analyzeRepository as analyzeGroq, explainCodeFile as explainGroq, generateReadmeFromTree as readmeGroq } from './groqService.js';
import { fileURLToPath } from 'url';

/**
 * Unified content generation service.
 * @param {Object} options
 * @param {string} options.prompt - The prompt text.
 * @param {string} [options.provider] - The LLM provider ('gemini' or 'groq'). Defaults to 'gemini'.
 * @param {string} [options.model] - Optional custom model override.
 * @returns {Promise<string>} The generated content.
 */
async function generateContent({ prompt, provider = 'gemini', model }) {
  const selectedProvider = (provider || 'gemini').toLowerCase();

  if (selectedProvider === 'groq') {
    const groqModel = model || GROQ_DEFAULT_MODEL;
    return await generateGroq(prompt, groqModel);
  } else {
    // Default to Gemini
    const geminiModel = model || GEMINI_DEFAULT_MODEL;
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: prompt,
    });
    return response.text;
  }
}

/**
 * Unified repository structure analysis service.
 * @param {Object} options
 * @param {Object} options.repositoryStructure - The repository structure JSON object.
 * @param {string} [options.provider] - The LLM provider ('gemini' or 'groq'). Defaults to 'gemini'.
 * @param {string} [options.model] - Optional custom model override.
 * @returns {Promise<Object>} The analyzed components and relationships.
 */
async function analyzeRepository({ repositoryStructure, provider = 'gemini', model }) {
  const selectedProvider = (provider || 'gemini').toLowerCase();

  if (selectedProvider === 'groq') {
    const groqModel = model || GROQ_DEFAULT_MODEL;
    return await analyzeGroq(repositoryStructure, groqModel);
  } else {
    // Default to Gemini with Groq fallback
    try {
      const geminiModel = model || GEMINI_DEFAULT_MODEL;
      return await analyzeGemini(repositoryStructure, geminiModel);
    } catch (error) {
      console.warn(`Gemini analysis failed (${error.message}). Trying Groq fallback...`);
      try {
        return await analyzeGroq(repositoryStructure, GROQ_DEFAULT_MODEL);
      } catch (groqError) {
        console.warn(`Groq fallback analysis also failed (${groqError.message}). Using programmatic fallback.`);
        // Fall back to programmatic parser via geminiService
        const { generateFallbackResponse, validateArchitecture } = await import('./geminiService.js');
        const fallback = generateFallbackResponse(repositoryStructure);
        return validateArchitecture(fallback);
      }
    }
  }
}

// Automatically run the test if run directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  console.log('--- Testing Unified Facade: generateContent (Gemini) ---');
  try {
    const responseGemini = await generateContent({ prompt: 'Say Hello', provider: 'gemini' });
    console.log('Gemini:', responseGemini);
  } catch (error) {
    console.error('Gemini generateContent failed:', error);
  }

  console.log('\n--- Testing Unified Facade: generateContent (Groq) ---');
  try {
    const responseGroq = await generateContent({ prompt: 'Say Hello', provider: 'groq' });
    console.log('Groq:', responseGroq);
  } catch (error) {
    console.error('Groq generateContent failed:', error);
  }

  console.log('\n--- Testing Unified Facade: analyzeRepository (Gemini) ---');
  const exampleInput = {
    "src": {
      "components": ["Navbar.jsx"],
      "pages": ["Dashboard.jsx"]
    }
  };
  try {
    const analysisGemini = await analyzeRepository({ repositoryStructure: exampleInput, provider: 'gemini' });
    console.log('Gemini Analysis:', JSON.stringify(analysisGemini, null, 2));
  } catch (error) {
    console.error('Gemini analyzeRepository failed:', error);
  }

  console.log('\n--- Testing Unified Facade: analyzeRepository (Groq) ---');
  try {
    const analysisGroq = await analyzeRepository({ repositoryStructure: exampleInput, provider: 'groq' });
    console.log('Groq Analysis:', JSON.stringify(analysisGroq, null, 2));
  } catch (error) {
    console.error('Groq analyzeRepository failed:', error);
  }
}
/**
 * Unified code file explanation service.
 * @param {Object} options
 * @param {string} options.fileName - The name of the file.
 * @param {string} options.fileContent - The file content.
 * @param {string} [options.provider] - The LLM provider ('gemini' or 'groq').
 * @param {string} [options.model] - Optional custom model override.
 * @returns {Promise<Object>} The explanation JSON object.
 */
async function explainCodeFile({ fileName, fileContent, provider = 'gemini', model }) {
  const selectedProvider = (provider || 'gemini').toLowerCase();

  if (selectedProvider === 'groq') {
    return await explainGroq(fileName, fileContent, model);
  } else {
    try {
      return await explainGemini(fileName, fileContent, model);
    } catch (error) {
      console.warn(`Gemini explanation failed (${error.message}). Trying Groq fallback...`);
      try {
        return await explainGroq(fileName, fileContent, GROQ_DEFAULT_MODEL);
      } catch (groqError) {
        console.warn(`Groq fallback explanation also failed (${groqError.message}). Using programmatic fallback.`);
        const { generateProgrammaticExplanation } = await import('./geminiService.js');
        return generateProgrammaticExplanation(fileName, fileContent);
      }
    }
  }
}

/**
 * Unified README generation service.
 * @param {Object} options
 * @param {string} options.projectName - The project name.
 * @param {Object} options.fileTree - The repository structure JSON tree.
 * @param {string} [options.provider] - The LLM provider.
 * @param {string} [options.model] - Optional custom model override.
 * @returns {Promise<string>} The generated README text.
 */
async function generateReadmeFromTree({ projectName, fileTree, projectMetadata = null, provider = 'gemini', model }) {
  const selectedProvider = (provider || 'gemini').toLowerCase();

  if (selectedProvider === 'groq') {
    return await readmeGroq(projectName, fileTree, projectMetadata, model);
  } else {
    try {
      return await readmeGemini(projectName, fileTree, projectMetadata, model);
    } catch (error) {
      console.warn(`Gemini README generation failed (${error.message}). Trying Groq fallback...`);
      try {
        return await readmeGroq(projectName, fileTree, projectMetadata, GROQ_DEFAULT_MODEL);
      } catch (groqError) {
        console.warn(`Groq fallback README generation also failed (${groqError.message}). Using programmatic fallback.`);
        const { generateProgrammaticReadme } = await import('./geminiService.js');
        return generateProgrammaticReadme(projectName, fileTree);
      }
    }
  }
}

export { generateContent, analyzeRepository, explainCodeFile, generateReadmeFromTree };
