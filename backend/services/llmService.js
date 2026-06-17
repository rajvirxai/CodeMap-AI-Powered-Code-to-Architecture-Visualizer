const { ai, MODEL_NAME: GEMINI_DEFAULT_MODEL, analyzeRepository: analyzeGemini } = require('./geminiService');
const { DEFAULT_MODEL: GROQ_DEFAULT_MODEL, generateContent: generateGroq, analyzeRepository: analyzeGroq } = require('./groqService');

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

module.exports = {
  generateContent,
  analyzeRepository
};
