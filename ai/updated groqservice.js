import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFallbackResponse, validateArchitecture } from './geminiService.js';

// Load environment variables
dotenv.config();
if (!process.env.GROQ_API_KEY) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error('Warning: GROQ_API_KEY is not defined in the environment variables.');
}

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Basic Hello World test function for Groq
 */
async function testGroq() {
  try {
    const text = await generateContent('Say Hello');
    console.log('Groq Response:', text);
  } catch (error) {
    console.error('Error generating content from Groq:', error.message);
  }
}

/**
 * Generates text content using the Groq API.
 * @param {string} prompt - The prompt text.
 * @param {string} [model] - The Groq model to use.
 * @returns {Promise<string>} The generated content.
 */
async function generateContent(prompt, model = DEFAULT_MODEL) {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API HTTP error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Groq returned an empty response.');
  }

  return data.choices[0].message.content;
}

/**
 * Analyzes a repository structure using Groq.
 * @param {Object} repoStructure - The repository structure JSON object.
 * @param {string} [model] - The Groq model to use.
 * @returns {Promise<Object>} The analyzed components and relationships.
 */
async function analyzeRepository(repoStructure, model = DEFAULT_MODEL) {
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Falling back to programmatic parsing.');
    return generateFallbackResponse(repoStructure);
  }

  const repoStructureString = JSON.stringify(repoStructure, null, 2);
  const systemInstruction = `You are a senior software architect and repository structure analyst.

Your task is to analyze a repository JSON tree and convert it into a clean, validated software architecture representation.

INPUT:
You will receive a JSON tree representing folders and files of a code repository. The tree has a recursive structure where folders and files are nodes containing properties: "name" (string), "type" (string: "folder" or "file"), and optionally "children" (array of nested node objects).

GOAL:
Infer the system architecture from the repository structure and return ONLY a valid JSON object with:
- summary: project overview
- nodes: architectural entities
- edges: relationships between entities

IMPORTANT RULES:
1. Return only JSON. Do not add explanations, markdown, comments, or extra text.
2. Use this exact output format:
{
  "summary": "",
  "nodes": [],
  "edges": []
}
3. Every node must have:
   - id: unique string
   - label: human-readable name
   - type: one of [frontend, backend, database, api, service, utility, config, auth, storage, other]
4. Every edge must have:
   - source: source node id
   - target: target node id
   - relationship: short string describing the relation
5. Do not create duplicate nodes.
6. Do not create edges that reference missing nodes.
7. Infer architecture based on folder/file names such as:
   - components, pages, app, ui, views → frontend
   - routes, controllers, api, endpoints → api/backend
   - services, business logic, helpers → service
   - models, schema, migrations, prisma, db → database
   - auth, login, register, oauth → auth
   - storage, upload, files, assets → storage
   - config, env, settings → config
8. If the structure is unclear, infer the most likely architecture conservatively.
9. Keep the architecture meaningful and minimal. Prefer important modules over every tiny file.
10. Preserve hierarchy when useful, but compress redundant low-level details.
11. If the repository is small, output a compact architecture. If it is large, group related folders into logical modules.
12. The response must be valid JSON and parseable by standard JSON parsers.
13. Generate a concise project summary (2-5 sentences).
14. The summary should explain:
   - Project type
   - Main modules
   - Architectural layers
   - Key responsibilities
15. The summary must be concise and under 100 words.
ANALYSIS APPROACH:
- Identify the major layers of the application.
- Detect relationships such as:
  - frontend uses backend
  - backend calls service
  - service accesses database
  - api exposes endpoints
  - auth protects routes
- Model only the architecture that can be reasonably inferred from the repository tree.

OUTPUT QUALITY REQUIREMENTS:
- Use stable and consistent ids, such as:
  frontend, backend, api, auth, database, services, utils
- Make labels descriptive, such as:
  "Frontend UI", "REST API", "Authentication", "Database Layer"
- Ensure the graph is simple, readable, and logically connected.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          {
            role: 'user',
            content: `Analyze this repository structure:\n\n${repoStructureString}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API HTTP error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Groq returned an empty response.');
    }

    const responseText = data.choices[0].message.content;
    const parsed = JSON.parse(responseText);
    return validateArchitecture(parsed);
  } catch (error) {
    console.warn(`Groq API call failed (${error.message}). Falling back to programmatic structure parsing.`);
    const fallback = generateFallbackResponse(repoStructure);
    return validateArchitecture(fallback);
  }
}

// Automatically run the test if run directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  console.log('--- Testing Groq basic Hello ---');
  await testGroq();

  console.log('\n--- Testing Groq analyzeRepository ---');
  const exampleInput = {
    "src": {
      "components": [
        "Navbar.jsx",
        "Sidebar.jsx"
      ],
      "pages": [
        "Dashboard.jsx"
      ]
    }
  };

  try {
    const analysis = await analyzeRepository(exampleInput);
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('Groq Analysis test failed:', error);
  }
}

export { DEFAULT_MODEL, testGroq, generateContent, analyzeRepository };
