const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./repoScanner');

test('scanDirectory parses directory structure correctly and ignores specified folders', (t) => {
  // Setup: create a temporary directory structure
  const tempDirName = `test-temp-${Date.now()}`;
  const tempDirPath = path.join(__dirname, tempDirName);
  
  fs.mkdirSync(tempDirPath);
  fs.mkdirSync(path.join(tempDirPath, 'subfolder'));
  fs.mkdirSync(path.join(tempDirPath, 'node_modules'));
  fs.mkdirSync(path.join(tempDirPath, '.git'));
  
  fs.writeFileSync(path.join(tempDirPath, 'file1.txt'), 'hello');
  fs.writeFileSync(path.join(tempDirPath, 'subfolder', 'file2.js'), 'console.log()');
  fs.writeFileSync(path.join(tempDirPath, 'node_modules', 'ignored.js'), 'ignore');
  fs.writeFileSync(path.join(tempDirPath, '.git', 'config'), 'ignore');
  fs.writeFileSync(path.join(tempDirPath, '.gitignore'), 'ignore');
  
  try {
    // Run the function
    const result = scanDirectory(tempDirPath, 'root');
    
    // Assert structure
    assert.strictEqual(result.name, 'root');
    assert.strictEqual(result.type, 'folder');
    
    // Check children
    const childNames = result.children.map(c => c.name);
    
    // file1.txt and subfolder should be included
    assert.ok(childNames.includes('file1.txt'));
    assert.ok(childNames.includes('subfolder'));
    
    // node_modules, .git, and .gitignore should be excluded
    assert.ok(!childNames.includes('node_modules'));
    assert.ok(!childNames.includes('.git'));
    assert.ok(!childNames.includes('.gitignore'));
    
    // Check nested child
    const subfolderNode = result.children.find(c => c.name === 'subfolder');
    assert.strictEqual(subfolderNode.type, 'folder');
    assert.strictEqual(subfolderNode.children.length, 1);
    assert.strictEqual(subfolderNode.children[0].name, 'file2.js');
    assert.strictEqual(subfolderNode.children[0].type, 'file');
  } finally {
    // Teardown: recursively delete temporary directory
    fs.rmSync(tempDirPath, { recursive: true, force: true });
  }
});
