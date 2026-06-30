import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
if (!process.env.GEMINI_API_KEY) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Warning: GEMINI_API_KEY is not defined in the environment variables.');
}

// Initialize the reusable Gemini client
const ai = new GoogleGenAI({ apiKey });

// Define the standard model name
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Basic Hello World test function
 */
async function testGemini() {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Say Hello",
    });
    console.log('Gemini Response:', response.text);
  } catch (error) {
    console.error('Error generating content:', error.message);
  }
}

/**
 * Validates and normalizes the architectural nodes and edges.
 * @param {Object} output - The raw JSON output from the LLM or fallback.
 * @returns {Object} Cleaned and validated architecture object.
 */
/**
 * Validates and normalizes the architectural nodes and edges.
 * @param {Object} output - The raw JSON output from the LLM or fallback.
 * @returns {Object} Cleaned and validated architecture object.
 */
function validateArchitecture(output) {
  if (!output || typeof output !== 'object') {
    return {
      summary: "No summary provided.",
      entryPoint: "unknown",
      framework: "unknown",
      database: "unknown",
      externalAPIs: [],
      authentication: "unknown",
      techStack: [],
      modules: [],
      nodes: [],
      edges: []
    };
  }

  const summary = typeof output.summary === 'string' ? output.summary : "No summary provided.";
  const entryPoint = typeof output.entryPoint === 'string' ? output.entryPoint : "unknown";
  const framework = typeof output.framework === 'string' ? output.framework : "unknown";
  const database = typeof output.database === 'string' ? output.database : "unknown";
  const externalAPIs = Array.isArray(output.externalAPIs) ? output.externalAPIs.map(String) : [];
  const authentication = typeof output.authentication === 'string' ? output.authentication : "unknown";
  const techStack = Array.isArray(output.techStack) ? output.techStack.map(String) : [];
  const modules = Array.isArray(output.modules) ? output.modules : [];

  const nodes = Array.isArray(output.nodes) ? output.nodes : [];
  const edges = Array.isArray(output.edges) ? output.edges : [];

  const validTypes = new Set(['frontend', 'backend', 'database', 'api', 'service', 'utility', 'config', 'auth', 'storage', 'other']);

  const cleanedNodes = [];
  const seenNodeIds = new Set();

  for (const node of nodes) {
    if (!node || typeof node !== 'object' || !node.id) {
      continue;
    }
    const id = String(node.id).trim();
    if (seenNodeIds.has(id)) {
      continue;
    }
    const label = String(node.label || id).trim();
    let type = String(node.type).trim().toLowerCase();
    if (!validTypes.has(type)) {
      type = 'other';
    }
    cleanedNodes.push({ id, label, type });
    seenNodeIds.add(id);
  }

  const cleanedEdges = [];
  for (const edge of edges) {
    if (!edge || typeof edge !== 'object' || !edge.source || !edge.target) {
      continue;
    }
    const source = String(edge.source).trim();
    const target = String(edge.target).trim();
    const relationship = String(edge.relationship || 'imports').trim();

    if (seenNodeIds.has(source) && seenNodeIds.has(target)) {
      cleanedEdges.push({ source, target, relationship });
    }
  }

  return {
    summary,
    entryPoint,
    framework,
    database,
    externalAPIs,
    authentication,
    techStack,
    modules,
    nodes: cleanedNodes,
    edges: cleanedEdges
  };
}

/**
 * Generates a fallback mock repository structure if the API call fails or is rate-limited.
 * @param {Object} repoStructure - The repository structure JSON object.
 * @returns {Object} Fallback parsed response matching the expected schema.
 */
function generateFallbackResponse(repoStructure) {
  const nodes = [];
  const edges = [];
  const addedNodes = new Set();

  function addNode(id, label, type) {
    if (!addedNodes.has(id)) {
      nodes.push({ id, label, type });
      addedNodes.add(id);
    }
  }

  // Detect structure type (Backend Team children array format vs flat key-value format)
  const isRecursiveChildrenFormat = repoStructure && 
    (typeof repoStructure === 'object') && 
    ('children' in repoStructure || 'type' in repoStructure);

  if (isRecursiveChildrenFormat) {
    function traverseRecursive(node, parentPath = '') {
      if (!node || typeof node !== 'object') return;

      const name = node.name || 'root';
      const isFolder = node.type === 'folder';
      const path = parentPath ? `${parentPath}/${name}` : name;
      const id = path.replace(/[^a-zA-Z0-9]/g, '_');
      const label = name;

      const lowerName = name.toLowerCase();
      let type = 'other';
      if (['components', 'pages', 'app', 'ui', 'views', 'jsx', 'tsx', 'css', 'style'].some(w => lowerName.includes(w))) {
        type = 'frontend';
      } else if (['routes', 'controllers', 'api', 'endpoints'].some(w => lowerName.includes(w))) {
        type = 'api';
      } else if (['services', 'helpers'].some(w => lowerName.includes(w))) {
        type = 'service';
      } else if (['models', 'schema', 'migrations', 'prisma', 'db'].some(w => lowerName.includes(w))) {
        type = 'database';
      } else if (['auth', 'login', 'register', 'oauth'].some(w => lowerName.includes(w))) {
        type = 'auth';
      } else if (['storage', 'upload', 'files', 'assets'].some(w => lowerName.includes(w))) {
        type = 'storage';
      } else if (['config', 'env', 'settings', 'json'].some(w => lowerName.includes(w))) {
        type = 'config';
      }

      addNode(id, label, type);

      if (parentPath) {
        const parentId = parentPath.replace(/[^a-zA-Z0-9]/g, '_');
        edges.push({
          source: parentId,
          target: id,
          relationship: 'contains'
        });
      }

      if (isFolder && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverseRecursive(child, path);
        }
      }
    }
    traverseRecursive(repoStructure);
  } else {
    function traverseFlat(obj, currentPath = '') {
      if (!obj || typeof obj !== 'object') return;

      for (const [key, value] of Object.entries(obj)) {
        const path = currentPath ? `${currentPath}/${key}` : key;
        const lowerKey = key.toLowerCase();

        let type = 'other';
        if (['components', 'pages', 'app', 'ui', 'views'].some(w => lowerKey.includes(w))) {
          type = 'frontend';
        } else if (['routes', 'controllers', 'api', 'endpoints'].some(w => lowerKey.includes(w))) {
          type = 'api';
        } else if (['services', 'helpers'].some(w => lowerKey.includes(w))) {
          type = 'service';
        } else if (['models', 'schema', 'migrations', 'prisma', 'db'].some(w => lowerKey.includes(w))) {
          type = 'database';
        } else if (['auth', 'login', 'register', 'oauth'].some(w => lowerKey.includes(w))) {
          type = 'auth';
        } else if (['storage', 'upload', 'files', 'assets'].some(w => lowerKey.includes(w))) {
          type = 'storage';
        } else if (['config', 'env', 'settings'].some(w => lowerKey.includes(w))) {
          type = 'config';
        }

        const id = path.replace(/[^a-zA-Z0-9]/g, '_');
        const label = key;

        if (Array.isArray(value)) {
          addNode(id, label, type);
          for (const item of value) {
            const itemId = `${id}_${item.replace(/[^a-zA-Z0-9]/g, '_')}`;
            let itemType = type;
            if (itemType === 'other') {
              const lowerItem = item.toLowerCase();
              if (['page', 'home', 'about'].some(w => lowerItem.includes(w))) {
                itemType = 'frontend';
              }
            }
            addNode(itemId, item, itemType);
            edges.push({
              source: id,
              target: itemId,
              relationship: 'contains'
            });
          }
        } else if (typeof value === 'object') {
          addNode(id, label, type);
          traverseFlat(value, path);
          if (currentPath) {
            const parentId = currentPath.replace(/[^a-zA-Z0-9]/g, '_');
            edges.push({
              source: parentId,
              target: id,
              relationship: 'contains'
            });
          }
        } else if (typeof value === 'string') {
          addNode(id, label, type);
        }
      }
    }
    traverseFlat(repoStructure);
  }

  // Programmatic fallback for techStack, framework, database, externalAPIs, authentication, entryPoint, modules
  const techStack = ['Node.js'];
  let framework = 'Express';
  let database = 'SQLite';
  const externalAPIs = [];
  let authentication = 'None';
  let entryPoint = 'index.js';
  const modules = [];

  const allNames = [];
  function collectNames(node) {
    if (!node) return;
    if (node.name) allNames.push(node.name.toLowerCase());
    if (node.children) {
      node.children.forEach(collectNames);
    }
  }
  collectNames(repoStructure);

  if (allNames.some(n => n.includes('next.config') || n === 'next')) {
    techStack.push('Next.js', 'React');
    framework = 'Next.js';
  } else if (allNames.some(n => n.endsWith('.jsx') || n.endsWith('.tsx') || n.includes('react'))) {
    techStack.push('React');
    framework = 'React SPA';
  }
  if (allNames.some(n => n.endsWith('.tsx') || n.endsWith('.ts') || n === 'tsconfig.json')) {
    techStack.push('TypeScript');
  }
  if (allNames.some(n => n.includes('tailwind'))) {
    techStack.push('TailwindCSS');
  }
  if (allNames.some(n => n.includes('express') || n === 'server.js' || n === 'app.js' || n.includes('controller') || n.includes('route'))) {
    techStack.push('Express');
    framework = 'Express.js';
  }
  if (allNames.some(n => n.includes('mongoose') || n.includes('mongodb') || n === 'user.js' || n === 'models')) {
    techStack.push('MongoDB', 'Mongoose');
    database = 'MongoDB';
  }
  if (allNames.some(n => n.includes('sqlite') || n.includes('sqlite3'))) {
    techStack.push('SQLite');
    database = 'SQLite';
  }
  if (allNames.some(n => n.includes('prisma'))) {
    techStack.push('Prisma');
  }
  if (allNames.some(n => n.includes('auth') || n.includes('jwt') || n.includes('passport') || n.includes('login') || n.includes('session'))) {
    authentication = 'JWT / Session-based';
  }
  if (allNames.some(n => n.includes('stripe') || n.includes('paypal') || n.includes('sendgrid') || n.includes('twilio') || n.includes('firebase'))) {
    if (allNames.some(n => n.includes('stripe'))) externalAPIs.push('Stripe API');
    if (allNames.some(n => n.includes('sendgrid'))) externalAPIs.push('SendGrid API');
    if (allNames.some(n => n.includes('twilio'))) externalAPIs.push('Twilio API');
    if (allNames.some(n => n.includes('firebase'))) externalAPIs.push('Firebase API');
  }
  if (externalAPIs.length === 0) {
    externalAPIs.push('None detected');
  }

  // Find standard entry files
  const entries = ['index.js', 'app.js', 'App.js', 'server.js', 'main.js', 'index.tsx', 'index.ts', 'main.ts'];
  for (const name of entries) {
    if (allNames.includes(name.toLowerCase())) {
      entryPoint = name;
      break;
    }
  }

  // Create standard module groupings for fallback modules list
  if (repoStructure && repoStructure.children) {
    const folders = repoStructure.children.filter(child => child.type === 'folder');
    for (const folder of folders) {
      const childrenFiles = (folder.children || [])
        .filter(c => c.type === 'file')
        .slice(0, 3)
        .map(c => c.name);

      modules.push({
        name: folder.name,
        type: folder.name.toLowerCase().includes('controller') ? 'Controller' : 'Directory',
        description: `Contains components and assets for ${folder.name}`,
        children: childrenFiles
      });
    }
  }

  if (modules.length === 0) {
    modules.push({
      name: 'root',
      type: 'Directory',
      description: 'Project root workspace files',
      children: allNames.slice(0, 3)
    });
  }

  const nameVal = (repoStructure && repoStructure.name) ? repoStructure.name : 'Project';

  return {
    summary: `Heuristic parsing completed successfully for ${nameVal}. Codebase uses ${framework} and is backed by ${database}.`,
    entryPoint,
    framework,
    database,
    externalAPIs,
    authentication,
    techStack,
    modules,
    nodes,
    edges
  };
}

/**
 * Analyzes a repository structure using Gemini.
 * @param {Object} repoStructure - The repository structure JSON object.
 * @param {string} [model] - The Gemini model to use.
 * @returns {Promise<Object>} The analyzed components and relationships.
 */
async function analyzeRepository(repoStructure, model = MODEL_NAME) {
  const repoStructureString = JSON.stringify(repoStructure, null, 2);
  const prompt = `NOW ANALYZE THE FOLLOWING REPOSITORY JSON TREE AND RETURN ONLY THE JSON OBJECT:
${repoStructureString}`;

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
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            entryPoint: { type: Type.STRING },
            framework: { type: Type.STRING },
            database: { type: Type.STRING },
            externalAPIs: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            authentication: { type: Type.STRING },
            techStack: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  children: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "type", "description", "children"]
              }
            },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["id", "label", "type"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  relationship: { type: Type.STRING }
                },
                required: ["source", "target", "relationship"]
              }
            }
          },
          required: ["summary", "entryPoint", "framework", "database", "externalAPIs", "authentication", "techStack", "modules", "nodes", "edges"]
        }
      }
    });

    const responseText = response.text;
    const parsed = JSON.parse(responseText);
    return validateArchitecture(parsed);
  } catch (error) {
    console.warn(`Gemini API call failed (${error.message}). Falling back to programmatic structure parsing.`);
    const fallback = generateFallbackResponse(repoStructure);
    return validateArchitecture(fallback);
  }
}

// Automatically run the test if run directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  (async () => {
    console.log('--- Testing basic Hello ---');
    await testGemini();

    console.log('\n--- Testing analyzeRepository ---');
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
      console.error('Analysis test failed:', error);
    }
  })();
}

/**
 * Explains a single code file using the configured Gemini model, or a fallback.
 *
 * @param {string} fileName - The name of the file (e.g. index.js).
 * @param {string} fileContent - The text contents of the file.
 * @param {string} [model] - The Gemini model to use.
 * @returns {Promise<Object>} The explanation JSON object.
 */
async function explainCodeFile(fileName, fileContent, model = MODEL_NAME) {
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

  const prompt = `Analyze the following code file and generate a high-quality software architecture explanation.
  
File Name: ${fileName}

File Content:
\`\`\`
${fileContent}
\`\`\`

Instructions:
1. "purpose": Summarize in 1-2 clear, simple sentences what this file's main objective is.
2. "inputs": List up to 4 key inputs, parameter structures, imported objects/packages, props, or API payloads this file consumes.
3. "outputs": List up to 4 key outputs, returned values, exported functions/variables, rendered elements, or API responses this file yields.
4. "dependencies": List up to 4 key external packages or local utility files imported by this file.
5. "role": Classify the architectural role of this file in 1-3 words (e.g., Controller, Component, Middleware, Router, Utility, Database Model, Config).
6. Respond STRICTLY with a valid JSON object matching the schema:
{
  "purpose": "string",
  "inputs": ["string"],
  "outputs": ["string"],
  "dependencies": ["string"],
  "role": "string"
}
Do not return any markdown code fences, comments, or extra conversational text.`;

  const systemInstruction = `You are a senior software architect. Analyze the code file and generate a high-quality software architecture explanation. Respond strictly with the expected JSON format.`;

  if (apiKey) {
    try {
      console.log(`🔮 GEMINI ANALYZER: Explaining file ${fileName}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              purpose: { type: Type.STRING },
              inputs: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              outputs: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              dependencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              role: { type: Type.STRING }
            },
            required: ["purpose", "inputs", "outputs", "dependencies", "role"]
          }
        }
      });

      const responseText = response.text;
      return JSON.parse(responseText);
    } catch (error) {
      console.warn(`Gemini API call failed (${error.message}). Falling back to local explanation heuristics.`);
      return generateProgrammaticExplanation(fileName, fileContent);
    }
  } else {
    return generateProgrammaticExplanation(fileName, fileContent);
  }
}

/**
 * Programmatic explanation fallback based on file naming and basic regex.
 */
function generateProgrammaticExplanation(fileName, fileContent) {
  const nameLower = fileName.toLowerCase();
  const nameNoExt = fileName.split('.')[0];
  
  let purpose = `Defines module parameters and functional routines for ${fileName}.`;
  let inputs = ['Module parameters'];
  let outputs = ['Exported methods'];
  let dependencies = [];
  let role = 'Module Asset';

  try {
    const importRegex = /(?:import\s+.*?\s+from\s+['"](.*?)['"]|require\(['"](.*?)['"]\))/g;
    let match;
    const depsSet = new Set();
    while ((match = importRegex.exec(fileContent)) !== null) {
      const depName = match[1] || match[2];
      if (depName && !depName.startsWith('.')) {
        depsSet.add(depName);
      }
    }
    dependencies = Array.from(depsSet).slice(0, 4);
  } catch (e) {
    // Ignore regex errors
  }

  if (nameLower.includes('controller')) {
    role = 'Controller';
    purpose = `Handles requests, coordinates application logic flow, and invokes business services for ${nameNoExt}.`;
    inputs = ['HTTP request headers/body', 'URL query parameters'];
    outputs = ['HTTP response status', 'JSON payload payloads'];
  } else if (nameLower.includes('route')) {
    role = 'Router';
    purpose = `Registers API endpoints and maps incoming HTTP paths to their respective handler controllers.`;
    inputs = ['Client request paths', 'HTTP methods (GET/POST)'];
    outputs = ['Route handler callback mapping'];
    dependencies.push('express');
  } else if (nameLower.includes('model') || nameLower.includes('schema') || nameLower.includes('db')) {
    role = 'Database Schema / Connection';
    purpose = `Manages database connections, defines data structures, and registers collection schemas.`;
    inputs = ['Document instantiation payloads'];
    outputs = ['Mongoose/MongoDB document queries'];
    dependencies.push('mongoose');
  } else if (nameLower.includes('util') || nameLower.includes('helper')) {
    role = 'Utility Helper';
    purpose = `Provides helper subroutines and format calculations shared across various modules.`;
    inputs = ['Input values/parameters'];
    outputs = ['Formatted calculations/return values'];
  } else if (nameLower.includes('component') || nameLower.includes('page') || /\.(jsx|tsx)$/.test(nameLower)) {
    role = 'View / Component';
    purpose = `Renders UI elements, hooks dynamic event handlers, and handles component layouts.`;
    inputs = ['React props', 'User trigger clicks'];
    outputs = ['JSX elements tree', 'State event payloads'];
    dependencies.push('react');
  }

  return {
    purpose,
    inputs: inputs.length > 0 ? inputs : ['None'],
    outputs: outputs.length > 0 ? outputs : ['None'],
    dependencies: dependencies.length > 0 ? dependencies : ['None'],
    role
  };
}

/**
 * Automatically generates a professional README.md markdown text based on a repository structure.
 * @param {string} projectName - The name of the project.
 * @param {Object} fileTree - The repository structure JSON tree.
 * @param {Object|string} [projectMetadata] - Optional project metadata.
 * @param {string} [model] - The Gemini model to use.
 * @returns {Promise<string>} The generated markdown README text.
 */
async function generateReadmeFromTree(projectName, fileTree, projectMetadata = null, model = MODEL_NAME) {
  if (typeof projectMetadata === 'string') {
    model = projectMetadata;
    projectMetadata = null;
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

  const prompt = `You are a professional technical writer and senior developer. 
Your task is to generate a comprehensive, production-ready, beautiful README.md file in markdown format for a project repository named "${projectName}".
${metadataStr}
Below is the JSON file tree representation of the codebase:
\`\`\`json
${JSON.stringify(fileTree, null, 2)}
\`\`\`

Please include the following standard sections in the README.md:
1. **Title and Subtitle**: A descriptive and catchy description of the project.
2. **Key Features**: Bullets outlining the primary features.
3. **Project Architecture**: Brief overview of the folders and architecture layers (e.g. backend routes, frontend views, utilities).
4. **Getting Started**: Steps to install dependencies and run the application locally (make this specific to the detected framework and tech stack).
5. **Technologies Used**: A neat list or table of the key libraries and technologies.
6. **License / Contributing**: Standard placeholder footer text.

Guidelines:
- Return ONLY the raw markdown content.
- Do NOT wrap your output in markdown code fences (\`\`\`markdown ... \`\`\`).
- Make the writing professional, readable, and highly informative.`;

  if (apiKey) {
    try {
      console.log(`🔮 GEMINI ANALYZER: Generating README.md for ${projectName} using Gemini...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });
      return response.text.trim().replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    } catch (error) {
      console.warn(`Gemini README generation failed. Falling back to programmatic README fallback. Error: ${error.message}`);
      return generateProgrammaticReadme(projectName, fileTree);
    }
  } else {
    return generateProgrammaticReadme(projectName, fileTree);
  }
}

/**
 * Programmatic README generator fallback.
 */
function generateProgrammaticReadme(projectName, fileTree) {
  const displayName = projectName || 'My Project';
  return `# ${displayName}

A software project codebase visualizer.

## 🚀 Key Features
- High-level directory tree parsing and visualization.
- Automated module structural layout connection.
- Isolated service verification and code analysis pipelines.

## 📁 Repository Structure
An overview of the codebase organization:
\`\`\`
${JSON.stringify(fileTree, null, 2)}
\`\`\`

## 🛠️ Installation & Setup
1. Clone this repository locally.
2. Run \`npm install\` to boot dependencies.
3. Execute \`npm run dev\` to launch the development environment.

## 📝 License
Distributed under the ISC License. Free for local utilization and contributions.`;
}

export {
  ai,
  MODEL_NAME,
  testGemini,
  analyzeRepository,
  generateFallbackResponse,
  validateArchitecture,
  explainCodeFile,
  generateProgrammaticExplanation,
  generateReadmeFromTree,
  generateProgrammaticReadme
};


