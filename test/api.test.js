/**
 * API Integration Tests
 * 
 * This file uses Node.js native test runner (node:test) and assertions (node:assert)
 * to test the Express API endpoints. It launches the application on a temporary
 * port to run assertions, then shuts down cleanly.
 */

const test = require('node:test');
const assert = require('node:assert');
const app = require('../index');

test('CodeMap Backend API Tests', async (t) => {
  let server;
  let baseUrl;

  // Setup: Start the Express server on an ephemeral port before running tests
  t.before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  // Teardown: Close the Express server after all tests complete
  t.after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  // Test 1: GET /health
  await t.test('GET /health returns 200 and success status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.message, 'Server is healthy');
  });

  // Test 2: POST /analyze (Missing folderId)
  await t.test('POST /analyze returns 400 if folderId is missing', async () => {
    const res = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.strictEqual(body.error, 'Missing folderId in request body.');
  });

  // Test 3: POST /analyze (Non-existent folderId)
  await t.test('POST /analyze returns 404 if folderId does not exist', async () => {
    const res = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderId: 'non-existent-folder-12345' })
    });
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.match(body.error, /Folder not found/);
  });

  // Test 4: POST /upload (No file uploaded)
  await t.test('POST /upload returns 400 if no file is uploaded', async () => {
    const res = await fetch(`${baseUrl}/upload`, {
      method: 'POST'
      // No body sent
    });
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.match(body.error, /No file uploaded/);
  });

  // Test 5: POST /upload (Invalid file format - e.g. text file)
  await t.test('POST /upload returns 400 if file is not a ZIP file', async () => {
    const formData = new FormData();
    const textBlob = new Blob(['console.log("hello");'], { type: 'text/javascript' });
    formData.append('file', textBlob, 'app.js');

    const res = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 400);

    const body = await res.json();
    assert.match(body.error, /Only ZIP files/);
  });
});
