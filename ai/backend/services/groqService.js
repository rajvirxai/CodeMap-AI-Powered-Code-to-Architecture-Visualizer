import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFallbackResponse, validateArchitecture, generateProgrammaticExplanation, generateProgrammaticReadme } from './geminiService.js';

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
Infer the system architecture and technical layout from the repository structure. You must detect the five key elements:
1. "entryPoint": The main execution/bootstrap file of the codebase (e.g. index.js, App.jsx, src/index.tsx, main.py, server.js).
2. "framework": The primary framework or library used to structure the project (e.g., Next.js, Express, React, Spring Boot, Django, Flask, FastAPI). If none is found, return "None".
3. "database": The primary database management system or database ORM libraries detected (e.g., MongoDB, PostgreSQL, MySQL, SQLite, Mongoose, Prisma, SQLAlchemy). If none is found, return "None".
4. "externalAPIs": A list of up to 4 key external APIs, integrations, or messaging/payment gateways detected in dependency/code structure (e.g., Stripe, Twilio, SendGrid, GitHub API, Firebase, Auth0). If none are found, return an empty array.
5. "authentication": The primary mechanism used to handle users, permissions, and credentials (e.g., JWT, NextAuth, OAuth2, Passport.js, Session, Firebase Auth). If none is found, return "None".

Additionally, generate:
- "summary": A concise high-level architecture summary in 2-3 sentences (under 100 words).
- "techStack": An array of up to 6 key technologies (frameworks, databases, languages, libraries) detected.
- "modules": Group files/directories into 2 to 5 high-level architectural modules (e.g. Controllers, Routes, Components, Utilities, Hooks, Pages).
- "nodes": Architectural entities in the graph (used for visual rendering).
- "edges": Relationships between visual entities.

IMPORTANT RULES:
1. Return only JSON. Do not add explanations, markdown, comments, or extra text.
2. Use this exact output format:
{
  "summary": "",
  "entryPoint": "",
  "framework": "",
  "database": "",
  "externalAPIs": [],
  "authentication": "",
  "techStack": [],
  "modules": [
    {
      "name": "module name",
      "type": "Directory|Controller|Router|Component|Utility|Service|Database|Hook",
      "description": "one sentence description",
      "children": ["filename1", "filename2"]
    }
  ],
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

/**
 * Explains a single code file using Groq.
 * @param {string} fileName - The name of the file (e.g. index.js).
 * @param {string} fileContent - The text contents of the file.
 * @param {string} [model] - The Groq model to use.
 * @returns {Promise<Object>} The explanation JSON object.
 */
async function explainCodeFile(fileName, fileContent, model = DEFAULT_MODEL) {
  const lowerName = fileName.toLowerCase();
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.gz', '.tar', '.mp3', '.mp4', '.woff', '.woff2', '.ttf', '.eot', '.db', '.sqlite'];
  const isBinary = binaryExtensions.some(ext => lowerName.endsWith(ext));
  const isEmpty = !fileContent || fileContent.trim() === '';

  if (isBinary || isEmpty) {
    let purpose = `Static resource or asset file: ${fileName}`;
    let role = "Asset";
    let dependencies = [];
    if (lowerName.endsWith('.pdf')) {
      purpose = "Document resource file containing text or layouts.";
      role = "Document";
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].some(ext => lowerName.endsWith(ext))) {
      purpose = "Visual asset or image element used in user interface representation.";
      role = "Image Asset";
    } else if (lowerName.endsWith('.db') || lowerName.endsWith('.sqlite')) {
      purpose = "Local database storage file containing structured tables.";
      role = "Database Storage";
    } else if (lowerName.endsWith('.zip') || lowerName.endsWith('.gz') || lowerName.endsWith('.tar')) {
      purpose = "Compressed archive directory containing source files or build assets.";
      role = "Archive";
    } else if (isEmpty) {
      purpose = `Empty configuration or placeholder file: ${fileName}`;
      role = "Configuration";
    }
    return {
      purpose,
      inputs: [],
      outputs: [],
      dependencies,
      role
    };
  }

  if (lowerName === '.gitignore') {
    return {
      purpose: "Specifies intentionally untracked files and folders that git should ignore.",
      inputs: [],
      outputs: [],
      dependencies: [],
      role: "Configuration"
    };
  } else if (lowerName === '.env' || lowerName === '.env.example') {
    return {
      purpose: "Stores system environment variables, external credentials, and API configuration parameters.",
      inputs: [],
      outputs: [],
      dependencies: [],
      role: "Configuration"
    };
  }

  if (!apiKey) {
    return generateProgrammaticExplanation(fileName, fileContent);
  }

  const prompt = `Analyze the code file below and extract its architectural attributes.
  
File Name: ${fileName}
Content:
${fileContent}

Respond STRICTLY with this JSON schema:
{
  "purpose": "1-2 sentences explaining what the file does",
  "inputs": ["parameter1/import1", "parameter2/import2"],
  "outputs": ["returnVal1/export1", "returnVal2/export2"],
  "dependencies": ["dep1", "dep2"],
  "role": "architectural role"
}`;

  try {
    console.log(`⚡ GEMINI ANALYZER: Explaining file ${fileName} using Groq Llama fallback...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a senior software architect. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from Groq API');

    return JSON.parse(text);
  } catch (error) {
    console.warn(`Groq explain failed (${error.message}). Using programmatic fallback.`);
    return generateProgrammaticExplanation(fileName, fileContent);
  }
}

/**
 * Generates README using Groq.
 * @param {string} projectName - The name of the project.
 * @param {Object} fileTree - The repository structure JSON tree.
 * @param {string} [model] - The Groq model to use.
 * @returns {Promise<string>} The generated README markdown text.
 */
async function generateReadmeFromTree(projectName, fileTree, projectMetadata = null, model = DEFAULT_MODEL) {
  if (typeof projectMetadata === 'string') {
    model = projectMetadata;
    projectMetadata = null;
  }

  if (!apiKey) {
    return generateProgrammaticReadme(projectName, fileTree);
  }

  let metadataStr = '';
  if (projectMetadata && typeof projectMetadata === 'object') {
    metadataStr = `
Primary architectural metadata detected for this repository:
- Main Entry Point: ${projectMetadata.entryPoint || 'unknown'}
- Core Framework: ${projectMetadata.framework || 'None'}
- Database: ${projectMetadata.database || 'None'}
- Authentication: ${projectMetadata.authentication || 'None'}
- External APIs: ${projectMetadata.externalAPIs ? projectMetadata.externalAPIs.join(', ') : 'None'}
- Tech Stack: ${projectMetadata.techStack ? projectMetadata.techStack.join(', ') : 'None'}
`;
  }

  const prompt = `Generate a professional, comprehensive README.md file in markdown format for a project repository named "${projectName}".
${metadataStr}
Below is the JSON file tree:
${JSON.stringify(fileTree, null, 2)}

Return ONLY raw markdown text. No explanations. Make installation instructions specific to the detected framework and tech stack.`;

  try {
    console.log(`⚡ GEMINI ANALYZER: Generating README.md using Groq Llama...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a technical documentation assistant. Respond ONLY with markdown text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from Groq API');
    return text.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  } catch (error) {
    console.warn(`Groq README failed. Using programmatic fallback. Error: ${error.message}`);
    return generateProgrammaticReadme(projectName, fileTree);
  }
}

export { DEFAULT_MODEL, testGroq, generateContent, analyzeRepository, explainCodeFile, generateReadmeFromTree };
