/**
 * Gemini Architecture Analyzer Utility
 * 
 * This file handles analyzing the generated directory tree JSON.
 * It integrates with the Google Gemini API to produce an architectural analysis
 * of the code structure (entry point, modules, and file distributions).
 * If the GEMINI_API_KEY is not defined, it uses smart heuristics to extract
 * a realistic architecture representation from the file tree.
 */

const fs = require('fs');
const path = require('path');

/**
 * Analyzes the scanned file tree to extract architecture details.
 * 
 * @param {object} fileTree - The JSON tree structure of the repository.
 * @returns {Promise<object>} The Architecture JSON representation.
 */
async function analyzeArchitecture(fileTree) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      console.log('🔮 GEMINI ANALYZER: Calling Gemini API for architecture analysis...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert software architect. Analyze the following directory tree representation of a codebase and extract its high-level architecture.
                    
File Tree JSON:
${JSON.stringify(fileTree, null, 2)}

Instructions:
1. Identify the main entry file of the codebase (e.g. index.js, App.js, src/index.tsx, main.ts, main.py).
2. Identify the primary framework or library used to structure the project (e.g., Next.js, Express, React, Spring Boot, Django, Flask, FastAPI). If none is found, return "None".
3. Identify the primary database management system or database ORM libraries detected (e.g., MongoDB, PostgreSQL, MySQL, SQLite, Mongoose, Prisma, SQLAlchemy). If none is found, return "None".
4. Extract a list of up to 4 key external APIs, integrations, or messaging/payment gateways detected in dependency/code structure (e.g., Stripe, Twilio, SendGrid, GitHub API, Firebase, Auth0). If none are found, return an empty array.
5. Identify the primary mechanism used to handle users, permissions, and credentials (e.g., JWT, NextAuth, OAuth2, Passport.js, Session, Firebase Auth). If none is found, return "None".
6. Extract a list of up to 6 key technologies, frameworks, databases, or libraries detected in the codebase (e.g. React, Next.js, Express, MongoDB, TailwindCSS, TypeScript) and return them in "techStack".
7. Group files/directories into 2 to 5 high-level architectural modules (e.g. Controllers, Routes, Components, Utilities, Hooks, Pages).
   For each module, determine:
   - "name": The folder or module name.
   - "type": Its role type (e.g. Directory, Controller, Router, Component, Utility).
   - "description": A short one-sentence explanation of what it does.
   - "children": List up to 3 key files (filenames only, no paths) belonging to this module.
8. Generate a high-level, concise summary of the repository's codebase and architecture in 2-3 sentences.
9. Respond STRICTLY with a valid JSON object matching the schema:
{
  "summary": "string describing the high-level architecture of the repository in 2-3 sentences",
  "entryPoint": "string",
  "framework": "string",
  "database": "string",
  "externalAPIs": ["string"],
  "authentication": "string",
  "techStack": ["string"],
  "modules": [
    {
      "name": "string",
      "type": "string",
      "description": "string",
      "children": ["string"]
    }
  ]
}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const responseData = await response.json();
      const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResult) {
        const cleanText = textResult.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleanText);
      }
      throw new Error('Empty response from Gemini API');
    } catch (error) {
      console.warn('⚠️ GEMINI ANALYZER WARNING: Gemini API call failed. Trying Groq fallback. Error:', error.message);
      return analyzeWithGroq(fileTree);
    }
  } else {
    console.log('ℹ️ GEMINI ANALYZER: No GEMINI_API_KEY detected. Trying Groq fallback...');
    return analyzeWithGroq(fileTree);
  }
}

/**
 * Groq fallback analyzer — called when Gemini is unavailable or rate-limited.
 *
 * @param {object} fileTree - The JSON tree structure of the repository.
 * @returns {Promise<object>} The Architecture JSON representation.
 */
async function analyzeWithGroq(fileTree) {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    console.log('ℹ️ GEMINI ANALYZER: No GROQ_API_KEY detected. Using programmatic fallback.');
    return generateFallbackArchitecture(fileTree);
  }

  try {
    console.log('⚡ GEMINI ANALYZER: Calling Groq API as fallback for architecture analysis...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software architect. Respond ONLY with valid JSON, no markdown, no explanation.'
          },
          {
            role: 'user',
            content: `Analyze the following directory tree of a codebase and extract its high-level architecture.

File Tree JSON:
${JSON.stringify(fileTree, null, 2)}

Respond STRICTLY with this JSON schema:
{
  "summary": "2-3 sentence description of the codebase architecture",
  "entryPoint": "main entry filename",
  "framework": "detected framework",
  "database": "detected database",
  "externalAPIs": ["api1", "api2"],
  "authentication": "detected auth method",
  "techStack": ["framework1", "database2", "library3"],
  "modules": [
    {
      "name": "module name",
      "type": "Directory|Controller|Router|Component|Utility|Service|Database|Hook",
      "description": "one sentence description",
      "children": ["filename1", "filename2"]
    }
  ]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) throw new Error('Empty response from Groq API');

    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    console.warn('⚠️ GEMINI ANALYZER WARNING: Groq API call also failed. Using programmatic fallback. Error:', error.message);
    return generateFallbackArchitecture(fileTree);
  }
}

/**
 * Fallback architecture generator using file tree heuristics.
 * 
 * @param {object} fileTree - The JSON tree structure of the repository.
 * @returns {object} The Architecture JSON representation.
 */
function generateFallbackArchitecture(fileTree) {
  let entryPoint = 'index.js';
  const modules = [];

  // 1. Find the entry point from root files
  if (fileTree && fileTree.children) {
    const rootFiles = fileTree.children.filter(child => child.type === 'file');
    
    // Look for standard entry files
    const entries = ['index.js', 'app.js', 'App.js', 'server.js', 'main.js', 'index.tsx', 'index.ts', 'main.ts'];
    const foundEntry = rootFiles.find(file => entries.includes(file.name));
    
    if (foundEntry) {
      entryPoint = foundEntry.name;
    } else if (rootFiles.length > 0) {
      // Fallback to first js/ts file found in root
      const codeFile = rootFiles.find(file => /\.(js|jsx|ts|tsx)$/.test(file.name));
      if (codeFile) {
        entryPoint = codeFile.name;
      }
    }
  }

  // Helper to get up to 3 non-folder children filenames from a folder node
  const getFolderFiles = (folderNode) => {
    if (!folderNode.children) return [];
    return folderNode.children
      .filter(child => child.type === 'file')
      .slice(0, 3)
      .map(file => file.name);
  };

  // 2. Scan direct folders in root and map them to modules
  if (fileTree && fileTree.children) {
    const folders = fileTree.children.filter(child => child.type === 'folder');

    for (const folder of folders) {
      // Guess module type and description based on name
      const nameLower = folder.name.toLowerCase();
      let type = 'Directory';
      let description = `Contains files for ${folder.name}`;

      if (nameLower.includes('controller')) {
        type = 'Controller';
        description = 'Handles business logic and API request parsing';
      } else if (nameLower.includes('route')) {
        type = 'Router';
        description = 'Defines and handles HTTP routes';
      } else if (nameLower.includes('component')) {
        type = 'Component';
        description = 'UI and view component layout rendering';
      } else if (nameLower.includes('util') || nameLower.includes('helper')) {
        type = 'Utility';
        description = 'Helper utility scripts and static functions';
      } else if (nameLower.includes('hook')) {
        type = 'Hook';
        description = 'Reusable custom react logic state hooks';
      } else if (nameLower.includes('api') || nameLower.includes('service')) {
        type = 'Service';
        description = 'Data fetching, database services, and client requests';
      } else if (nameLower.includes('model') || nameLower.includes('db')) {
        type = 'Database';
        description = 'Data schemas, model definitions, and database connections';
      }

      // Collect files inside folder
      const files = getFolderFiles(folder);
      
      // Capitalize first letter of folder name for display
      const displayName = folder.name.charAt(0).toUpperCase() + folder.name.slice(1);

      modules.push({
        name: displayName,
        type: type,
        description: description,
        children: files
      });
    }
  }

  // 3. Fallback default if no modules were found
  if (modules.length === 0) {
    modules.push({
      name: 'Source',
      type: 'Directory',
      description: 'Main application source directory',
      children: fileTree && fileTree.children 
        ? fileTree.children.slice(0, 3).map(c => c.name)
        : []
    });
  }

  const displayName = fileTree && fileTree.name ? fileTree.name : 'project';
  const summary = `Programmatic architecture analysis of the ${displayName} repository mapping out its entry point and core modules.`;

  const techStack = ['Node.js'];
  const allNames = [];
  function collectNames(node) {
    if (!node) return;
    if (node.name) allNames.push(node.name.toLowerCase());
    if (node.children) {
      node.children.forEach(collectNames);
    }
  }
  collectNames(fileTree);

  if (allNames.some(n => n.includes('next.config') || n === 'next')) {
    techStack.push('Next.js', 'React');
  } else if (allNames.some(n => n.endsWith('.jsx') || n.endsWith('.tsx') || n.includes('react'))) {
    techStack.push('React');
  }
  if (allNames.some(n => n.endsWith('.tsx') || n.endsWith('.ts') || n === 'tsconfig.json')) {
    techStack.push('TypeScript');
  }
  if (allNames.some(n => n.includes('tailwind'))) {
    techStack.push('TailwindCSS');
  }
  if (allNames.some(n => n.includes('express') || n === 'server.js' || n === 'app.js' || n.includes('controller') || n.includes('route'))) {
    techStack.push('Express');
  }
  if (allNames.some(n => n.includes('mongoose') || n.includes('mongodb') || n === 'user.js' || n === 'models')) {
    techStack.push('MongoDB', 'Mongoose');
  }
  if (allNames.some(n => n.includes('sqlite') || n.includes('sqlite3'))) {
    techStack.push('SQLite');
  }
  if (allNames.some(n => n.includes('prisma'))) {
    techStack.push('Prisma');
  }

  const uniqueTechStack = Array.from(new Set(techStack)).slice(0, 6);

  let framework = 'Express';
  let database = 'SQLite';
  const externalAPIs = [];
  let authentication = 'None';

  if (uniqueTechStack.includes('Next.js')) {
    framework = 'Next.js';
  } else if (uniqueTechStack.includes('React')) {
    framework = 'React SPA';
  } else if (uniqueTechStack.includes('Express')) {
    framework = 'Express.js';
  }

  if (uniqueTechStack.includes('MongoDB') || uniqueTechStack.includes('Mongoose')) {
    database = 'MongoDB';
  } else if (uniqueTechStack.includes('SQLite')) {
    database = 'SQLite';
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

  return {
    summary,
    entryPoint,
    framework,
    database,
    externalAPIs,
    authentication,
    techStack: uniqueTechStack,
    modules
  };
}

/**
 * Explains a single code file using the configured Gemini or Groq model, or a fallback.
 *
 * @param {string} fileName - The name of the file (e.g. index.js).
 * @param {string} fileContent - The text contents of the file.
 * @returns {Promise<object>} The explanation JSON object.
 */
async function explainCodeFile(fileName, fileContent) {
  const apiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

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

  if (apiKey) {
    try {
      console.log(`🔮 GEMINI ANALYZER: Explaining file ${fileName}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const responseData = await response.json();
      const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResult) {
        const cleanText = textResult.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleanText);
      }
      throw new Error('Empty response from Gemini API');
    } catch (error) {
      console.warn('⚠️ GEMINI ANALYZER WARNING: Gemini explain failed. Trying Groq fallback. Error:', error.message);
      return explainWithGroq(fileName, fileContent);
    }
  } else {
    return explainWithGroq(fileName, fileContent);
  }
}

/**
 * Groq fallback explanation builder.
 */
async function explainWithGroq(fileName, fileContent) {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    console.log('ℹ️ GEMINI ANALYZER: No GROQ_API_KEY. Using programmatic explanation fallback.');
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
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a senior software architect. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from Groq API');

    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    console.warn('⚠️ GEMINI ANALYZER WARNING: Groq explain failed. Using programmatic fallback. Error:', error.message);
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

  // Basic regex to find imports/requires
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
 * @returns {Promise<string>} The generated markdown README text.
 */
async function generateReadmeFromTree(projectName, fileTree) {
  const apiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const prompt = `You are a professional technical writer and senior developer. 
Your task is to generate a comprehensive, production-ready, beautiful README.md file in markdown format for a project repository named "${projectName}".

Below is the JSON file tree representation of the codebase:
\`\`\`json
${JSON.stringify(fileTree, null, 2)}
\`\`\`

Please include the following standard sections in the README.md:
1. **Title and Subtitle**: A descriptive and catchy description of the project.
2. **Key Features**: Bullets outlining the primary features.
3. **Project Architecture**: Brief overview of the folders and architecture layers (e.g. backend routes, frontend views, utilities).
4. **Getting Started**: Steps to install dependencies and run the application locally.
5. **Technologies Used**: A neat list or table of the key libraries and technologies.
6. **License / Contributing**: Standard placeholder footer text.

Guidelines:
- Return ONLY the raw markdown content.
- Do NOT wrap your output in markdown code fences (\`\`\`markdown ... \`\`\`).
- Make the writing professional, readable, and highly informative.`;

  if (apiKey) {
    try {
      console.log(`🔮 GEMINI ANALYZER: Generating README.md for ${projectName} using Gemini...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const responseData = await response.json();
      const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResult) {
        return textResult.trim().replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      }
      throw new Error('Empty response from Gemini API');
    } catch (error) {
      console.warn('⚠️ GEMINI ANALYZER WARNING: Gemini README generation failed. Trying Groq fallback. Error:', error.message);
      return generateReadmeWithGroq(projectName, fileTree);
    }
  } else {
    return generateReadmeWithGroq(projectName, fileTree);
  }
}

/**
 * Groq fallback README generator.
 */
async function generateReadmeWithGroq(projectName, fileTree) {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    console.log('ℹ️ GEMINI ANALYZER: No GROQ_API_KEY. Using programmatic README fallback.');
    return generateProgrammaticReadme(projectName, fileTree);
  }

  const prompt = `Generate a professional, comprehensive README.md file in markdown format for a project repository named "${projectName}".
Below is the JSON file tree:
${JSON.stringify(fileTree, null, 2)}

Return ONLY raw markdown text. No explanations.`;

  try {
    console.log(`⚡ GEMINI ANALYZER: Generating README.md using Groq Llama...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
    console.warn('⚠️ GEMINI ANALYZER WARNING: Groq README failed. Using programmatic fallback. Error:', error.message);
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

module.exports = {
  analyzeArchitecture,
  explainCodeFile,
  generateReadmeFromTree
};
