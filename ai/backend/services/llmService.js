import { ai, MODEL_NAME as GEMINI_DEFAULT_MODEL, analyzeRepository as analyzeGemini } from './geminiService.js';
import { DEFAULT_MODEL as GROQ_DEFAULT_MODEL, generateContent as generateGroq, analyzeRepository as analyzeGroq } from './groqService.js';
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
    // Default to Gemini
    const geminiModel = model || GEMINI_DEFAULT_MODEL;
    return await analyzeGemini(repositoryStructure, geminiModel);
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

export { generateContent, analyzeRepository };
