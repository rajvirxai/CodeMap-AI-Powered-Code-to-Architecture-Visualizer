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
function validateArchitecture(output) {
  if (!output || typeof output !== 'object') {
    return { summary: "No summary provided.", nodes: [], edges: [] };
  }

  const summary = typeof output.summary === 'string' ? output.summary : "No summary provided.";
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
    } else {
      console.warn(`Validation warning: Filtering out edge referencing missing node(s): ${source} -> ${target}`);
    }
  }

  return { summary, nodes: cleanedNodes, edges: cleanedEdges };
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

  return {
    summary: "Fallback architecture map. Constructed programmatically because the AI service was unavailable.",
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
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING
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
          required: ["summary", "nodes", "edges"]
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

export { ai, MODEL_NAME, testGemini, analyzeRepository, generateFallbackResponse, validateArchitecture };


