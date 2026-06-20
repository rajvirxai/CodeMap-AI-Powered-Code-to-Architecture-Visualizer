import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// Test script to send a user-input prompt to the local API route
async function testAPI() {
  const rl = readline.createInterface({ input, output });

  try {
    const prompting = await rl.question('Enter your prompt: ');
    rl.close();

    if (!prompting.trim()) {
      console.log('Prompt cannot be empty.');
      return;
    }

    console.log(`Sending test prompt to server: "${prompting}"...\n`);

    const response = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompting }),
    });

    const data = await response.json();
    console.log('--- Server Response ---');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error connecting to the server:', error.message);
    console.log('Please ensure your server is running (e.g., node server.js is running on port 3001).');
    rl.close();
  }
}

testAPI();
