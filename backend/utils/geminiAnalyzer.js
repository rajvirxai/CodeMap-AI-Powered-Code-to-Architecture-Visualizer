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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
1. Identify the main entry file of the codebase (e.g. index.js, App.js, src/index.tsx, main.ts).
2. Group files/directories into 2 to 5 high-level architectural modules (e.g. Controllers, Routes, Components, Utilities, Hooks, Pages).
3. For each module, determine:
   - "name": The folder or module name.
   - "type": Its role type (e.g. Directory, Controller, Router, Component, Utility).
   - "description": A short one-sentence explanation of what it does.
   - "children": List up to 3 key files (filenames only, no paths) belonging to this module.
4. Generate a high-level summary of the repository's codebase and architecture in 2-3 sentences.
5. Respond STRICTLY with a valid JSON object matching the schema:
{
  "summary": "string describing the high-level architecture of the repository in 2-3 sentences",
  "entryPoint": "string",
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
        return JSON.parse(textResult.trim());
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

  return {
    summary,
    entryPoint,
    modules
  };
}

module.exports = {
  analyzeArchitecture
};
