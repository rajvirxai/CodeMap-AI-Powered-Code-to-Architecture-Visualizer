import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load repo-tree.json
let repoTree = {};
try {
  repoTree = JSON.parse(fs.readFileSync(path.join(__dirname, 'repo-tree.json'), 'utf8'));
} catch (error) {
  console.error('Warning: could not read repo-tree.json', error.message);
}

// Test script to run the 4 cases against POST /api/analyze
async function runTests() {
  const cases = [
    {
      name: "Case 1: Only components",
      body: {
        "repositoryStructure": {
          "components": [
            "Navbar.jsx"
          ]
        }
      }
    },
    {
      name: "Case 2: Only pages",
      body: {
        "repositoryStructure": {
          "pages": [
            "Home.jsx",
            "About.jsx"
          ]
        }
      }
    },
    {
      name: "Case 3: Empty structure",
      body: {
        "repositoryStructure": {}
      }
    },
    {
      name: "Case 4: Real Backend tree (repo-tree.json)",
      body: {
        "repositoryStructure": repoTree
      }
    }
  ];

  const providers = ['gemini', 'groq'];

  for (const provider of providers) {
    console.log(`\n########################################`);
    console.log(`TESTING PROVIDER: ${provider.toUpperCase()}`);
    console.log(`########################################`);

    for (const c of cases) {
      console.log(`\n========================================`);
      console.log(`Running: ${c.name} (${provider.toUpperCase()})`);
      
      const requestBody = {
        ...c.body,
        provider: provider
      };

      console.log(`Request:`, JSON.stringify(requestBody, null, 2));
      
      try {
        const response = await fetch('http://localhost:3000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const status = response.status;
        const data = await response.json();
        console.log(`Status: ${status}`);
        console.log(`Response:`, JSON.stringify(data, null, 2));
      } catch (error) {
        console.error(`Error:`, error.message);
      }
    }
  }
}

runTests();

