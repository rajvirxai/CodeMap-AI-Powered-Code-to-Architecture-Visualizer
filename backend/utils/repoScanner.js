/**
 * Repository Scanner Utility
 * 
 * This file contains a recursive directory scanning function that takes a directory path
 * and returns a JSON tree representing the file and folder structure. It is designed to be
 * beginner-friendly and handles folders and files separately.
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively scans a directory and builds a nested JSON structure.
 * 
 * @param {string} currentPath - The absolute path of the file or folder to scan.
 * @param {string} name - The display name of the current file or folder.
 * @param {string} relativePath - The relative path from the root.
 * @returns {object|null} The JSON tree node, or null if an error occurs.
 */
function scanDirectory(currentPath, name, relativePath = '') {
  try {
    // Get system statistics for the current path (checks if it's a directory, file size, etc.)
    const stats = fs.statSync(currentPath);

    const currentRelativePath = relativePath || name;

    // If the path points to a file, we return a simple file node
    if (!stats.isDirectory()) {
      const ext = path.extname(name);
      const fileNode = {
        name: name,
        type: 'file',
        fileType: ext || 'unknown',
        path: currentRelativePath
      };

      // Extract metadata only for JS/TS code files
      const codeExtensions = ['.js', '.jsx', '.ts', '.tsx'];
      if (codeExtensions.includes(ext.toLowerCase())) {
        try {
          // Read the file content as a string
          const content = fs.readFileSync(currentPath, 'utf8');

          // Initialize metadata arrays using Sets to avoid duplicates
          const imports = new Set();
          const exports = new Set();
          const dependencies = new Set();

          // 1. Regex to find imports from 'require("module")'
          const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
          let match;
          while ((match = requireRegex.exec(content)) !== null) {
            const moduleName = match[1];
            imports.add(moduleName);
            // Dependencies are local file imports (starting with '.')
            if (moduleName.startsWith('.')) {
              dependencies.add(moduleName);
            }
          }

          // 2. Regex to find imports from 'import ... from "module"' or 'import "module"'
          const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
          while ((match = importRegex.exec(content)) !== null) {
            const moduleName = match[1];
            imports.add(moduleName);
            // Dependencies are local file imports (starting with '.')
            if (moduleName.startsWith('.')) {
              dependencies.add(moduleName);
            }
          }

          // 3. Regex to find named exports (e.g., export const myFunc = ...)
          const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g;
          while ((match = exportRegex.exec(content)) !== null) {
            exports.add(match[1]);
          }

          // 4. Regex to find export blocks (e.g., export { a, b })
          const exportListRegex = /export\s+{([^}]+)}/g;
          while ((match = exportListRegex.exec(content)) !== null) {
            const items = match[1].split(',').map(i => i.trim().split(/\s+/)[0]);
            items.forEach(i => { if (i) exports.add(i); });
          }

          // 5. Regex to find module.exports (e.g., module.exports = { a, b } or module.exports = myFunc)
          const moduleExportsRegex = /module\.exports\s*=\s*(?:{([^}]+)}|([a-zA-Z0-9_$]+))/g;
          while ((match = moduleExportsRegex.exec(content)) !== null) {
            if (match[1]) {
              // Extract from object
              const items = match[1].split(',').map(i => i.trim().split(/\s+/)[0]);
              items.forEach(i => { if (i) exports.add(i); });
            } else if (match[2]) {
              // Extract single assignment
              exports.add(match[2]);
            }
          }

          // 6. Regex to find individual property exports (e.g., exports.myFunc = ...)
          const simpleExportRegex = /exports\.([a-zA-Z0-9_$]+)\s*=/g;
          while ((match = simpleExportRegex.exec(content)) !== null) {
            exports.add(match[1]);
          }

          // Attach the extracted metadata to the file node
          fileNode.imports = Array.from(imports);
          fileNode.exports = Array.from(exports);
          fileNode.dependencies = Array.from(dependencies);

        } catch (error) {
          // If a file can't be read/parsed, we skip metadata extraction 
          // and return the basic file info without crashing the scan.
          console.warn(`Could not extract metadata for ${currentPath}:`, error.message);
        }
      }

      return fileNode;
    }

    // If it's a directory, we need to scan its children
    const node = {
      name: name,
      type: 'folder',
      path: currentRelativePath,
      children: []
    };

    // Read all files/folders inside the current directory
    const files = fs.readdirSync(currentPath);

    // List of common junk folders to ignore
    const ignoredFolders = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', 'tmp', '.next', 'out'];

    for (const file of files) {
      // Skip hidden files/directories and dependency/build folders
      // to avoid bloating the output tree and to improve performance.
      if (ignoredFolders.includes(file) || file.startsWith('.')) {
        continue;
      }

      // Resolve the full absolute path of the child item
      const childPath = path.join(currentPath, file);
      const childRelativePath = relativePath ? `${relativePath}/${file}` : `${name}/${file}`;

      // Recursively scan the child item
      const childNode = scanDirectory(childPath, file, childRelativePath);

      if (childNode) {
        // Add it to the children array
        node.children.push(childNode);
      }
    }

    return node;
  } catch (error) {
    console.error(`Error scanning ${currentPath}:`, error.message);
    return null;
  }
}

module.exports = {
  scanDirectory
};
